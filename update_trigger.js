import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:RcwNzW5seRwPx61P@db.vggytwvhfumqitisqklv.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          new.id, 
          new.email, 
          (new.raw_user_meta_data->>'full_name'), 
          COALESCE(new.raw_user_meta_data->>'role', 'staff')
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await client.query(sql);
    console.log('Trigger update completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
