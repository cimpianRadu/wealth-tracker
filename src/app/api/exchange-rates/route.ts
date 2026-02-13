import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.bnr.ro/nbrfxrates.xml', {
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch BNR rates' },
        { status: 502 }
      );
    }

    const xml = await res.text();

    // Parse EUR rate
    const eurMatch = xml.match(/<Rate currency="EUR">([0-9.]+)<\/Rate>/);
    const usdMatch = xml.match(/<Rate currency="USD">([0-9.]+)<\/Rate>/);

    if (!eurMatch || !usdMatch) {
      return NextResponse.json(
        { error: 'Could not parse BNR XML' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      eurToRon: parseFloat(eurMatch[1]),
      usdToRon: parseFloat(usdMatch[1]),
      source: 'BNR',
      date: new Date().toISOString().split('T')[0],
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
