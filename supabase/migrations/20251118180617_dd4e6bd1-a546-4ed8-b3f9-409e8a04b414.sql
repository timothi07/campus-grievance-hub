-- Create role enum type
create type public.app_role as enum ('student', 'staff', 'admin');

-- Create departments table
create table public.departments (
  id serial primary key,
  name varchar(100) unique not null,
  created_at timestamp default now()
);

alter table public.departments enable row level security;

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name varchar(100) not null,
  department_id int references public.departments(id),
  register_number varchar(50),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.profiles enable row level security;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  
  -- Assign student role by default
  insert into public.user_roles (user_id, role)
  values (new.id, 'student');
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create user_roles table (CRITICAL for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function for role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create complaint categories table
create table public.categories (
  id serial primary key,
  name varchar(100) unique not null,
  department_id int references public.departments(id),
  created_at timestamp default now()
);

alter table public.categories enable row level security;

-- Create complaints table
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  department_id int references public.departments(id),
  category_id int references public.categories(id),
  title varchar(150) not null,
  description text not null,
  status varchar(20) default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  priority varchar(20) default 'medium' check (priority in ('low', 'medium', 'high')),
  attachment_url varchar,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.complaints enable row level security;

-- Create complaint_status_log table
create table public.complaint_status_log (
  id serial primary key,
  complaint_id uuid references public.complaints(id) on delete cascade not null,
  status varchar(20) not null check (status in ('pending', 'in_progress', 'resolved')),
  updated_by uuid references auth.users(id) not null,
  note text,
  timestamp timestamp default now()
);

alter table public.complaint_status_log enable row level security;

-- Create comments table
create table public.comments (
  id serial primary key,
  complaint_id uuid references public.complaints(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  comment_text text not null,
  attachment_url varchar,
  created_at timestamp default now()
);

alter table public.comments enable row level security;

-- Insert default departments
insert into public.departments (name) values
  ('Computer Science'),
  ('Electronics'),
  ('Hostel'),
  ('Library'),
  ('Transport'),
  ('Administration');

-- Insert default categories
insert into public.categories (name, department_id) values
  ('Academic Issue', 1),
  ('Lab Equipment', 1),
  ('Hostel Maintenance', 3),
  ('Food Quality', 3),
  ('Library Resources', 4),
  ('Transport Timing', 5),
  ('Fee Related', 6),
  ('Other', 6);

-- RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Staff can view all profiles"
  on public.profiles for select
  using (
    public.has_role(auth.uid(), 'staff') or 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for user_roles
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for complaints
create policy "Students can create complaints"
  on public.complaints for insert
  with check (auth.uid() = user_id and public.has_role(auth.uid(), 'student'));

create policy "Students can view own complaints"
  on public.complaints for select
  using (auth.uid() = user_id);

create policy "Staff can view department complaints"
  on public.complaints for select
  using (
    public.has_role(auth.uid(), 'staff') and
    department_id = (select department_id from public.profiles where id = auth.uid())
  );

create policy "Admins can view all complaints"
  on public.complaints for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Staff can update complaints"
  on public.complaints for update
  using (
    public.has_role(auth.uid(), 'staff') or 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for status log
create policy "Users can view status logs"
  on public.complaint_status_log for select
  using (
    exists (
      select 1 from public.complaints
      where id = complaint_id
    )
  );

create policy "Staff can create status logs"
  on public.complaint_status_log for insert
  with check (
    public.has_role(auth.uid(), 'staff') or 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for comments
create policy "Users can view comments"
  on public.comments for select
  using (
    exists (
      select 1 from public.complaints
      where id = complaint_id
    )
  );

create policy "Users can create comments"
  on public.comments for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.complaints
      where id = complaint_id
    )
  );

-- RLS Policies for categories and departments
create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Anyone can view departments"
  on public.departments for select
  using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage departments"
  on public.departments for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for complaint attachments
insert into storage.buckets (id, name, public)
values ('complaint-attachments', 'complaint-attachments', true);

-- RLS policies for storage
create policy "Students can upload attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'complaint-attachments' and
    public.has_role(auth.uid(), 'student')
  );

create policy "Users can view attachments"
  on storage.objects for select
  using (bucket_id = 'complaint-attachments');