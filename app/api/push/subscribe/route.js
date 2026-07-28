import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'اشتراك غير صالح' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { endpoint: subscription.endpoint, subscription },
        { onConflict: 'endpoint' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'حصل خطأ غير متوقع' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { endpoint } = await request.json();
    const supabase = await createServerSupabase();

    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'حصل خطأ غير متوقع' }, { status: 500 });
  }
}