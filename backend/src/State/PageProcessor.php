<?php

namespace App\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Page;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Écritures d'une page : créée en fin de portfolio, sans trace ; DELETE la met dans la corbeille
 * (ses traces restent dans la bibliothèque). Chaque écriture date la modification du portfolio.
 *
 * @implements ProcessorInterface<Page, Page|null>
 */
final class PageProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persist,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Page
    {
        if (($operation instanceof Post && null !== $data->getId()) || (isset($uriVariables['id']) && $data->getId() !== (int) $uriVariables['id'])) {
            throw new UnprocessableEntityHttpException('Page invalide.');
        }
        $data->getPortfolio()?->setDateModification(new \DateTime());

        if ($operation instanceof DeleteOperationInterface) {
            $data->setDateSuppression(new \DateTimeImmutable());
            $this->persist->process($data, $operation, $uriVariables, $context);

            return null;
        }
        if ($operation instanceof Post) {
            $ordres = array_map(static fn (Page $page): int => (int) $page->getOrdre(), $data->getPortfolio()->getPages()->toArray());
            $data->setOrdre(max([0, ...$ordres]) + 1);
            $data->getPortfolio()->addPage($data);
        }

        return $this->persist->process($data, $operation, $uriVariables, $context);
    }
}
