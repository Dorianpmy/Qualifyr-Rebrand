import 'server-only';
import type { InvoiceLine, InvoiceRow } from './invoices';

/**
 * Facture électronique — génération du XML structuré (UN/CEFACT CII, profil
 * BASIC, conforme EN 16931).
 *
 * **Pourquoi CII pur, sans PDF.** La réforme française (obligation
 * d'émission : 1er septembre 2026 pour les grandes entreprises et ETI,
 * 1er septembre 2027 pour le reste, dont la quasi-totalité des detailers)
 * accepte trois formats : Factur-X (PDF + XML dans un seul fichier), UBL, et
 * CII — les trois conformes à la même norme EN 16931. Produire le Factur-X
 * hybride demanderait une bibliothèque de manipulation de PDF (embarquer un
 * fichier dans un PDF/A-3 avec les métadonnées XMP requises) qui n'est pas
 * encore dans le projet. Le CII seul est un format à part entière, accepté
 * tel quel par toute Plateforme Agréée — ce module produit la partie qui
 * compte : la donnée structurée, valide indépendamment du PDF imprimable qui
 * existe déjà (`/app/invoices/[id]/print`).
 *
 * **Ce que ce module ne fait pas.** Il ne transmet rien : la réforme impose
 * de faire transiter la facture par une Plateforme Agréée (PDP) ou le portail
 * public — aucune des deux n'est branchée ici. Ce XML est prêt à être déposé
 * sur une PDP le jour où c'est nécessaire (obligation, ou client qui l'exige
 * plus tôt) ; en attendant, il documente le format à côté du PDF humain.
 *
 * **Sur la fiabilité de cette implémentation.** La structure suit le profil
 * BASIC de la norme EN 16931 telle que documentée publiquement, terme par
 * terme (commentaires `BT-*`/`BG-*` = Business Term / Business Group, les
 * identifiants officiels de la norme). Elle n'a pas été passée dans un
 * validateur Schematron officiel — avant tout usage face à une PDP réelle,
 * fais-la valider par un des validateurs gratuits (ex. celui de la FNFE-MPE
 * ou d'une PDP candidate).
 */

export type EInvoiceSeller = {
  readonly name: string;
  readonly siren: string | null;
  readonly siret: string | null;
  readonly tvaIntra: string | null;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly country: string;
};

const VAT_EXEMPT_REASON =
  'TVA non applicable, article 293 B du CGI (franchise en base de TVA)';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Deux décimales fixes : la norme interdit les montants sans décimale ou en notation scientifique. */
function amount(value: number): string {
  return value.toFixed(2);
}

/** Format `102` du code UN/CEFACT : AAAAMMJJ, sans séparateur. */
function dateStamp(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  const valid = Number.isNaN(date.getTime()) ? new Date() : date;
  const y = valid.getUTCFullYear();
  const m = String(valid.getUTCMonth() + 1).padStart(2, '0');
  const d = String(valid.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function partyXml(tag: 'SellerTradeParty' | 'BuyerTradeParty', party: {
  readonly name: string;
  readonly siren: string | null;
  readonly tvaIntra: string | null;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly country: string;
}): string {
  return `
      <ram:${tag}>
        <!-- BT-27/BT-44 : raison sociale -->
        <ram:Name>${escapeXml(party.name)}</ram:Name>
        ${
          party.siren
            ? `<ram:SpecifiedLegalOrganization>
          <!-- BT-30/BT-47 : identifiant légal, schéma 0002 = répertoire SIRENE -->
          <ram:ID schemeID="0002">${escapeXml(party.siren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
            : ''
        }
        <ram:PostalTradeAddress>
          ${party.postalCode ? `<ram:PostcodeCode>${escapeXml(party.postalCode)}</ram:PostcodeCode>` : ''}
          ${party.address ? `<ram:LineOne>${escapeXml(party.address)}</ram:LineOne>` : ''}
          ${party.city ? `<ram:CityName>${escapeXml(party.city)}</ram:CityName>` : ''}
          <ram:CountryID>${escapeXml(party.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
          party.tvaIntra
            ? `<ram:SpecifiedTaxRegistration>
          <!-- BT-31/BT-48 : numéro de TVA intracommunautaire -->
          <ram:ID schemeID="VA">${escapeXml(party.tvaIntra)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ''
        }
      </ram:${tag}>`;
}

function lineItemXml(line: InvoiceLine, position: number): string {
  const category = line.tva_rate > 0 ? 'S' : 'E';
  return `
      <ram:IncludedSupplyChainTradeLineItem>
        <ram:AssociatedDocumentLineDocument>
          <!-- BT-126 -->
          <ram:LineID>${position}</ram:LineID>
        </ram:AssociatedDocumentLineDocument>
        <ram:SpecifiedTradeProduct>
          <!-- BT-153 -->
          <ram:Name>${escapeXml(line.description)}</ram:Name>
        </ram:SpecifiedTradeProduct>
        <ram:SpecifiedLineTradeAgreement>
          <ram:NetPriceProductTradePrice>
            <!-- BT-146 -->
            <ram:ChargeAmount>${amount(Number(line.unit_price_ht))}</ram:ChargeAmount>
          </ram:NetPriceProductTradePrice>
        </ram:SpecifiedLineTradeAgreement>
        <ram:SpecifiedLineTradeDelivery>
          <!-- BT-129 : C62 = unité, pas de code métier plus précis ici -->
          <ram:BilledQuantity unitCode="C62">${amount(Number(line.quantity))}</ram:BilledQuantity>
        </ram:SpecifiedLineTradeDelivery>
        <ram:SpecifiedLineTradeSettlement>
          <ram:ApplicableTradeTax>
            <ram:TypeCode>VAT</ram:TypeCode>
            <!-- BT-151 : S = taux normal, E = exonéré (franchise en base) -->
            <ram:CategoryCode>${category}</ram:CategoryCode>
            <ram:RateApplicablePercent>${amount(Number(line.tva_rate))}</ram:RateApplicablePercent>
          </ram:ApplicableTradeTax>
          <ram:SpecifiedTradeSettlementLineMonetarySummation>
            <!-- BT-131 -->
            <ram:LineTotalAmount>${amount(Number(line.amount_ht))}</ram:LineTotalAmount>
          </ram:SpecifiedTradeSettlementLineMonetarySummation>
        </ram:SpecifiedLineTradeSettlement>
      </ram:IncludedSupplyChainTradeLineItem>`;
}

export function buildCiiInvoiceXml(input: {
  readonly invoice: InvoiceRow;
  readonly lines: readonly InvoiceLine[];
  readonly seller: EInvoiceSeller;
}): string {
  const { invoice, lines, seller } = input;
  const category = invoice.tva_franchise ? 'E' : 'S';

  const buyer = {
    name: invoice.client_name,
    siren: invoice.client_siren,
    tvaIntra: invoice.client_tva_intra,
    address: invoice.client_address,
    postalCode: invoice.client_postal,
    city: invoice.client_city,
    country: invoice.client_country ?? 'FR',
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <!-- Profil BASIC, norme EN 16931 -->
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <!-- BT-1 : numéro de facture -->
    <ram:ID>${escapeXml(invoice.number)}</ram:ID>
    <!-- BT-3 : 380 = facture commerciale (code liste UNTDID 1001) -->
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <!-- BT-2 -->
      <udt:DateTimeString format="102">${dateStamp(invoice.issued_at)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${invoice.notes ? `<ram:IncludedNote><ram:Content>${escapeXml(invoice.notes)}</ram:Content></ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${lines.map((line, index) => lineItemXml(line, index + 1)).join('\n')}
    <ram:ApplicableHeaderTradeAgreement>
${partyXml('SellerTradeParty', seller)}
${partyXml('BuyerTradeParty', buyer)}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery />
    <ram:ApplicableHeaderTradeSettlement>
      <!-- BT-5 -->
      <ram:InvoiceCurrencyCode>${escapeXml(invoice.currency ?? 'EUR')}</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <!-- BG-23 : synthèse de la TVA -->
        <ram:CalculatedAmount>${amount(Number(invoice.amount_tva))}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        ${invoice.tva_franchise ? `<ram:ExemptionReason>${escapeXml(VAT_EXEMPT_REASON)}</ram:ExemptionReason>` : ''}
        <ram:BasisAmount>${amount(Number(invoice.amount_ht))}</ram:BasisAmount>
        <ram:CategoryCode>${category}</ram:CategoryCode>
        <ram:RateApplicablePercent>${amount(Number(invoice.tva_rate))}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      ${
        invoice.payment_terms
          ? `<ram:SpecifiedTradePaymentTerms>
        <!-- BT-20 -->
        <ram:Description>${escapeXml(invoice.payment_terms)}</ram:Description>
      </ram:SpecifiedTradePaymentTerms>`
          : ''
      }
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <!-- BT-106 -->
        <ram:LineTotalAmount>${amount(Number(invoice.amount_ht))}</ram:LineTotalAmount>
        <!-- BT-109 -->
        <ram:TaxBasisTotalAmount>${amount(Number(invoice.amount_ht))}</ram:TaxBasisTotalAmount>
        <!-- BT-110 -->
        <ram:TaxTotalAmount currencyID="${escapeXml(invoice.currency ?? 'EUR')}">${amount(Number(invoice.amount_tva))}</ram:TaxTotalAmount>
        <!-- BT-112 -->
        <ram:GrandTotalAmount>${amount(Number(invoice.amount_ttc))}</ram:GrandTotalAmount>
        <!-- BT-115 -->
        <ram:DuePayableAmount>${amount(Number(invoice.amount_ttc))}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
