import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedPassword = process.env.ADMIN_SETUP_PASSWORD;

    if (!expectedPassword) {
      return NextResponse.json({ error: 'ADMIN_SETUP_PASSWORD is not configured in .env.local' }, { status: 500 });
    }

    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid setup password' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
       return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local' }, { status: 500 });
    }

    // Use Service Role key to bypass RLS and perform admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // CRITICAL SECURITY FIX: Only allow this route if NO admins exist yet.
    // Once the first admin is created, this backdoor permanently locks itself.
    const { count, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (countError) {
      return NextResponse.json({ error: 'Failed to verify admin status', details: countError }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json({ 
        error: 'Security Lock: An administrator already exists. This setup route is permanently disabled.' 
      }, { status: 403 });
    }

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      return NextResponse.json({ error: 'Failed to list users', details: usersError }, { status: 500 });
    }

    const user = usersData.users.find((u: any) => u.email === email);
    if (!user) {
      return NextResponse.json({ error: 'User not found with that email. Please sign up first.' }, { status: 404 });
    }

    // Execute the direct update query equivalent
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
       return NextResponse.json({ error: 'Failed to update profile role', details: updateError }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Successfully promoted ${email} to admin.` });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
