<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tanya AI - Edumath</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; }
        form { display: flex; gap: 8px; }
        input[type=text] { flex: 1; padding: 10px; font-size: 16px; }
        button { padding: 10px 16px; font-size: 16px; cursor: pointer; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-top: 16px; }
        .answer { font-size: 28px; font-weight: bold; }
        .muted { color: #666; font-size: 14px; }
        .error { color: #b00020; }
    </style>
</head>
<body>
    <h1>Tanya AI</h1>

    <form method="POST" action="/tanya-ai">
        @csrf
        <input type="text" name="question" placeholder="Contoh: 12 + 5"
               value="{{ old('question', $question ?? '') }}" required>
        <button type="submit">Tanya</button>
    </form>

    @error('question')
        <p class="error">{{ $message }}</p>
    @enderror

    @if (!empty($error))
        <p class="error">{{ $error }}</p>
    @endif

    @if (!empty($result))
        <div class="card">
            <div class="muted">Jawaban (dihitung Python)</div>
            @if (!is_null($result['checker'] ?? null))
                <div class="answer">{{ $result['checker'] }}</div>
            @else
                <div>Soal ini belum bisa dihitung otomatis.</div>
            @endif
        </div>

        <div class="card">
            <div class="muted">Penjelasan Llama</div>
            <div style="white-space: pre-wrap">{{ $result['llama'] ?? '-' }}</div>
        </div>

        <div class="card">
            <div class="muted">Prediksi MathLLM (model kecil, hanya pembanding)</div>
            <div>{{ $result['mathllm'] ?? '-' }}</div>
        </div>
    @endif
</body>
</html>
