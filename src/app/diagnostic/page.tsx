// The diagnostic funnel has been retired. This file could not be deleted
// because the sandbox blocked file deletion (unlink returned "Operation not
// permitted"), so it is neutralized here instead: visiting /diagnostic now
// 404s like any other removed route.
import { notFound } from 'next/navigation';

export default function DiagnosticPage(): never {
  notFound();
}
