<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Progres Belajar — EduMath</title>
    <style>
        :root{--blue:#2563eb;--blue-dark:#1d4ed8;--ink:#172554;--muted:#64748b;--line:#e5edf8;--bg:#f4f8ff;--green:#16a34a}
        *{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink)}
        .wrap{width:min(1080px,calc(100% - 32px));margin:28px auto 48px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}
        .brand{font-size:22px;font-weight:800;color:var(--blue);text-decoration:none}.brand span{color:#172554}.back{color:var(--blue);text-decoration:none;font-weight:700}
        .hero{background:linear-gradient(120deg,#2563eb,#4f8df7);color:white;border-radius:24px;padding:28px;display:grid;grid-template-columns:1.5fr 1fr;gap:24px;align-items:center;box-shadow:0 12px 32px #2563eb20}
        .eyebrow{font-size:12px;letter-spacing:1.5px;font-weight:800;opacity:.8;margin:0 0 8px}.hero h1{font-size:clamp(25px,4vw,36px);line-height:1.15;margin:0 0 10px}.hero p{margin:0;color:#eaf1ff}
        .progress-card{background:#ffffff20;border:1px solid #ffffff35;border-radius:18px;padding:18px}.progress-number{font-size:36px;font-weight:800}.track{height:10px;border-radius:99px;background:#ffffff45;overflow:hidden;margin:10px 0}.track span{display:block;height:100%;background:white;border-radius:99px}
        .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:20px 0}.stat{background:white;border:1px solid var(--line);border-radius:18px;padding:18px;min-width:0}.stat small{color:var(--muted);font-weight:600}.stat strong{display:block;font-size:28px;margin-top:6px;overflow-wrap:anywhere}
        .panel{background:white;border:1px solid var(--line);border-radius:20px;padding:22px;margin-top:18px}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.panel h2{font-size:20px;margin:0 0 5px}.sub{color:var(--muted);margin:0 0 18px;font-size:14px}
        .form-grid{display:grid;grid-template-columns:2fr 1fr auto;gap:10px}.field{width:100%;border:1px solid #dbe5f4;border-radius:12px;padding:12px 13px;font:inherit;background:white;min-width:0}.btn{border:0;border-radius:12px;padding:12px 16px;font:inherit;font-weight:750;cursor:pointer;background:var(--blue);color:white}.btn:hover{background:var(--blue-dark)}.btn-light{background:#eff6ff;color:var(--blue)}.btn-danger{background:#fff1f2;color:#be123c;padding:8px 10px}
        .notice{padding:12px 14px;border-radius:12px;background:#ecfdf5;color:#166534;margin:0 0 16px}.errors{background:#fff1f2;color:#9f1239}.items{display:grid;gap:10px}.item{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:15px}.check{width:42px;height:42px;flex:none;border-radius:13px;display:grid;place-items:center;background:#eff6ff;color:var(--blue);font-size:20px}.item.done .check{background:#dcfce7;color:#15803d}.item-main{flex:1;min-width:0}.item-title{font-weight:750;overflow-wrap:anywhere}.item.done .item-title{text-decoration:line-through;color:#64748b}.meta{font-size:13px;color:var(--muted);margin-top:4px}.actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.empty{padding:28px 12px;text-align:center;color:var(--muted)}.empty strong{display:block;color:var(--ink);margin-bottom:5px}
        @media(max-width:700px){.hero{grid-template-columns:1fr;padding:22px}.stats{gap:10px}.stat{padding:14px}.stat strong{font-size:24px}.form-grid{grid-template-columns:1fr}.panel{padding:17px}.item{align-items:flex-start}.actions{flex-direction:column;align-items:stretch}.actions form,.actions button{width:100%}}
        @media(max-width:420px){.stats{grid-template-columns:1fr}.top{align-items:flex-start}.wrap{width:calc(100% - 22px);margin-top:16px}}
    </style>
</head>
<body>
<main class="wrap">
    <header class="top">
        <a class="brand" href="{{ url('/') }}">Edu<span>Math</span></a>
        <a class="back" href="{{ url('/') }}">← Kembali ke dashboard</a>
    </header>

    <section class="hero">
        <div>
            <p class="eyebrow">PERJALANAN BELAJARMU</p>
            <h1>Terus maju, satu materi setiap hari! 📚</h1>
            <p>Catat materi yang sedang kamu pelajari dan tandai saat sudah dikuasai.</p>
        </div>
        <div class="progress-card">
            <div class="progress-number">{{ $percentage }}%</div>
            <div class="track" role="progressbar" aria-valuenow="{{ $percentage }}" aria-valuemin="0" aria-valuemax="100"><span style="width:{{ $percentage }}%"></span></div>
            <div>{{ $completed }} dari {{ $total }} materi selesai</div>
        </div>
    </section>

    <section class="stats" aria-label="Ringkasan progres">
        <article class="stat"><small>📘 Total Materi</small><strong>{{ $total }}</strong></article>
        <article class="stat"><small>✅ Materi Selesai</small><strong>{{ $completed }}</strong></article>
        <article class="stat"><small>🎯 Belum Selesai</small><strong>{{ $total - $completed }}</strong></article>
    </section>

    @if(session('success'))<div class="notice" role="status">{{ session('success') }}</div>@endif
    @if($errors->any())<div class="notice errors">@foreach($errors->all() as $error)<div>{{ $error }}</div>@endforeach</div>@endif

    <section class="panel">
        <h2>Tambah materi belajar</h2>
        <p class="sub">Masukkan materi yang ingin kamu pelajari. Data hanya terlihat oleh akunmu.</p>
        <form method="POST" action="{{ route('student-progress.store') }}" class="form-grid">
            @csrf
            <input class="field" name="title" maxlength="120" placeholder="Contoh: Pecahan dan desimal" value="{{ old('title') }}" required>
            <select class="field" name="category" required>
                @foreach(['Matematika','Aljabar','Geometri','Aritmetika','Statistika','Lainnya'] as $category)
                    <option value="{{ $category }}" @selected(old('category', 'Matematika') === $category)>{{ $category }}</option>
                @endforeach
            </select>
            <button class="btn" type="submit">+ Tambah Materi</button>
        </form>
    </section>

    <section class="panel">
        <div class="panel-head"><h2>Daftar progres</h2><span class="meta">{{ $total }} materi tercatat</span></div>
        <p class="sub">Perbarui status materi sesuai kemajuan belajarmu.</p>
        @forelse($items as $item)
            <article class="item {{ $item->is_completed ? 'done' : '' }}">
                <div class="check" aria-hidden="true">{{ $item->is_completed ? '✓' : '📖' }}</div>
                <div class="item-main">
                    <div class="item-title">{{ $item->title }}</div>
                    <div class="meta">{{ $item->category }} · {{ $item->is_completed ? 'Selesai' : 'Sedang dipelajari' }}@if($item->completed_at) · {{ $item->completed_at->format('d M Y') }}@endif</div>
                </div>
                <div class="actions">
                    <form method="POST" action="{{ route('student-progress.toggle', $item) }}">
                        @csrf
                        <button class="btn {{ $item->is_completed ? 'btn-light' : '' }}" type="submit">{{ $item->is_completed ? 'Batalkan selesai' : 'Tandai selesai' }}</button>
                    </form>
                    <form method="POST" action="{{ route('student-progress.destroy', $item) }}" onsubmit="return confirm('Hapus materi ini dari progres?')">
                        @csrf @method('DELETE')
                        <button class="btn btn-danger" type="submit">Hapus</button>
                    </form>
                </div>
            </article>
        @empty
            <div class="empty"><strong>Belum ada materi di progresmu.</strong>Tambahkan materi di atas untuk mulai mencatat kemajuan belajar.</div>
        @endforelse
    </section>
</main>
</body>
</html>
