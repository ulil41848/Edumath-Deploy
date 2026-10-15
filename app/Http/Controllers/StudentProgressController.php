<?php

namespace App\Http\Controllers;

use App\Models\StudentLearningProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class StudentProgressController extends Controller
{
    public function index(): View
    {
        $items = StudentLearningProgress::where('user_id', auth()->id())
            ->orderBy('is_completed')
            ->orderBy('created_at', 'desc')
            ->get();

        $total = $items->count();
        $completed = $items->where('is_completed', true)->count();

        return view('student-progress.index', [
            'items' => $items,
            'total' => $total,
            'completed' => $completed,
            'percentage' => $total > 0 ? (int) round($completed / $total * 100) : 0,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'category' => ['required', 'string', 'max:60'],
        ]);

        StudentLearningProgress::create([
            ...$validated,
            'user_id' => auth()->id(),
            'is_completed' => false,
        ]);

        return back()->with('success', 'Materi berhasil ditambahkan ke progres belajar.');
    }

    public function toggle(StudentLearningProgress $progress): RedirectResponse
    {
        abort_unless($progress->user_id === auth()->id(), 403);

        $completed = ! $progress->is_completed;
        $progress->update([
            'is_completed' => $completed,
            'completed_at' => $completed ? now() : null,
        ]);

        return back()->with('success', $completed
            ? 'Hebat! Materi ditandai selesai.'
            : 'Status materi dikembalikan menjadi belum selesai.');
    }

    public function destroy(StudentLearningProgress $progress): RedirectResponse
    {
        abort_unless($progress->user_id === auth()->id(), 403);
        $progress->delete();

        return back()->with('success', 'Materi dihapus dari daftar progres.');
    }
}
