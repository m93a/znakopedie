import type { RequestHandler } from "@sveltejs/kit";
import spreadTheSign from "$lib/scrapers/spreadTheSign";

export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get('q');

  if (q === null) throw new Error('You must specify a "q" parameter');
 
  return new Response(JSON.stringify(await spreadTheSign(q)));
}
