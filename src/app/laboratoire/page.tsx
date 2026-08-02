import type { Metadata } from 'next';
import { CreativeLab } from '@/components/editorial/CreativeLab';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata('/laboratoire');

export default function LaboratoirePage() {
  return (
    <>
      <Section spacing="tight" ruled>
        <Container>
          <SectionHeading
            level={1}
            eyebrow="Laboratoire"
            title="Explorer avant de construire."
            lead="Des études interactives pour éprouver une direction, une identité ou un parcours avant de les appliquer à une activité réelle."
          />
        </Container>
      </Section>

      <Section surface="raised" spacing="tight">
        <Container>
          <CreativeLab />
        </Container>
      </Section>
    </>
  );
}
