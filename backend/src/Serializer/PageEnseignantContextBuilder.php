<?php

namespace App\Serializer;

use ApiPlatform\State\SerializerContextBuilderInterface;
use App\Entity\Page;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\AsDecorator;
use Symfony\Component\DependencyInjection\Attribute\AutowireDecorated;
use Symfony\Component\HttpFoundation\Request;

/**
 * Une page lue par un enseignant ne liste que ses traces finalisées (groupe page:enseignant, Page::getTracesPubliques) :
 * l'IRI d'un brouillon, qui lui répondrait 404, n'apparaît pas. L'étudiant garde toutes les siennes.
 */
#[AsDecorator('api_platform.serializer.context_builder')]
final class PageEnseignantContextBuilder implements SerializerContextBuilderInterface
{
    public function __construct(
        #[AutowireDecorated]
        private readonly SerializerContextBuilderInterface $decore,
        private readonly Security $security,
    ) {
    }

    public function createFromRequest(Request $request, bool $normalization, ?array $extractedAttributes = null): array
    {
        $context = $this->decore->createFromRequest($request, $normalization, $extractedAttributes);
        if ($normalization && Page::class === ($context['resource_class'] ?? null) && $this->security->isGranted('ROLE_ENSEIGNANT')) {
            $context['groups'] = ['page:enseignant'];
        }

        return $context;
    }
}
