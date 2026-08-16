// The diagnostic funnel has been retired. This file could not be deleted
// because the sandbox blocked file deletion (unlink returned "Operation not
// permitted"), so it is neutralized here instead: the endpoint now always
// responds 404.
export async function POST() {
  return Response.json({ error: 'Not found' }, { status: 404 });
}
