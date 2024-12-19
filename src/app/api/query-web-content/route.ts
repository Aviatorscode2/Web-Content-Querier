// app/api/query-web-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebContentQuerier } from '../../../../utils/WebContentQuerier';


export async function POST(request: NextRequest) {
  try {
    const { url, query } = await request.json();

    if (!url || !query) {
      return NextResponse.json(
        { message: 'URL and query are required' }, 
        { status: 400 }
      );
    }

    const querier = new WebContentQuerier();
    
    // Extract web page content
    await querier.extractWebPageContent(url);

    // Query the content
    const result = await querier.queryContent(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing web content query:', error);
    return NextResponse.json(
      { 
        message: 'Error processing web content query', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}