<?php

namespace Tests\Feature;

use App\Models\GuruModeSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GuruModeSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_guru_sessions(): void
    {
        $this->getJson('/guru-sessions')->assertUnauthorized();
    }

    public function test_student_can_start_session_and_request_hint(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/guru-sessions', ['grade' => 1, 'material_key' => 'addition-to-20'])
            ->assertCreated()
            ->assertJsonPath('session.grade', 1)
            ->assertJsonPath('session.turn_count', 0);

        $session = GuruModeSession::query()->sole();

        $this->actingAs($user)
            ->postJson("/guru-sessions/{$session->id}/hints")
            ->assertOk()
            ->assertJsonPath('hint_count', 1);

        $this->assertDatabaseHas('guru_mode_sessions', [
            'id' => $session->id,
            'user_id' => $user->id,
            'hint_count' => 1,
        ]);
    }

    public function test_student_cannot_read_another_users_session(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $session = GuruModeSession::query()->create([
            'user_id' => $owner->id,
            'grade' => 1,
            'material_key' => 'addition-to-20',
            'material_title' => 'Penjumlahan sampai 20',
            'status' => 'active',
            'turns' => [],
            'current_question' => 'Bagaimana cara menjumlahkan?',
        ]);

        $this->actingAs($otherUser)
            ->getJson("/guru-sessions/{$session->id}")
            ->assertNotFound();
    }

    public function test_invalid_curriculum_selection_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/guru-sessions', ['grade' => 6, 'material_key' => 'addition-to-20'])
            ->assertUnprocessable();
    }

    public function test_ai_turn_is_validated_and_persisted(): void
    {
        config([
            'services.edumath_ai.base_url' => 'https://ai.example.test/v1',
            'services.edumath_ai.api_key' => 'test-key',
            'services.edumath_ai.model' => 'test-model',
        ]);
        Http::preventStrayRequests();
        Http::fake([
            'ai.example.test/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => ['content' => json_encode([
                        'message' => 'Bagus, kamu sudah menggabungkan kedua kelompok.',
                        'next_question' => 'Kalau ada 8 kelereng lalu mendapat 2 lagi, bagaimana menghitungnya?',
                        'concept_accuracy' => 'accurate',
                        'calculation_accuracy' => 'accurate',
                        'completeness' => 'complete',
                        'example_quality' => 'relevant',
                        'reasoning_consistency' => 'consistent',
                        'misconception' => null,
                        'concepts_understood' => ['menggabungkan kelompok'],
                    ], JSON_THROW_ON_ERROR)],
                ]],
            ]),
        ]);

        $user = User::factory()->create();
        $this->actingAs($user)
            ->postJson('/guru-sessions', ['grade' => 1, 'material_key' => 'addition-to-20'])
            ->assertCreated();

        $session = GuruModeSession::query()->sole();
        $this->postJson("/guru-sessions/{$session->id}/turns", ['answer' => 'Saya hitung 7 lalu maju 5 langkah.'])
            ->assertOk()
            ->assertJsonPath('turn_count', 1)
            ->assertJsonPath('can_complete', false);

        $this->assertCount(1, $session->fresh()->turns);
        Http::assertSent(fn ($request): bool => $request->hasHeader('Authorization', 'Bearer test-key'));
    }

    public function test_ai_failure_does_not_store_unassessed_answer(): void
    {
        config([
            'services.edumath_ai.base_url' => 'https://ai.example.test/v1',
            'services.edumath_ai.api_key' => 'test-key',
            'services.edumath_ai.model' => 'test-model',
        ]);
        Http::preventStrayRequests();
        Http::fake(['ai.example.test/v1/chat/completions' => Http::response([], 503)]);

        $user = User::factory()->create();
        $this->actingAs($user)
            ->postJson('/guru-sessions', ['grade' => 1, 'material_key' => 'addition-to-20'])
            ->assertCreated();
        $session = GuruModeSession::query()->sole();

        $this->postJson("/guru-sessions/{$session->id}/turns", ['answer' => 'Saya mulai dari angka tujuh.'])
            ->assertStatus(503);

        $this->assertSame([], $session->fresh()->turns);
    }

    public function test_completed_level_is_calculated_from_validated_rubric(): void
    {
        config([
            'services.edumath_ai.base_url' => 'https://ai.example.test/v1',
            'services.edumath_ai.api_key' => 'test-key',
            'services.edumath_ai.model' => 'test-model',
        ]);
        Http::preventStrayRequests();
        Http::fake([
            'ai.example.test/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => ['content' => json_encode([
                        'concepts_understood' => ['menggabungkan kelompok'],
                        'misconceptions' => [],
                        'practice_recommendation' => 'Coba buat soal penjumlahan dengan benda di rumah.',
                        'example_explanation' => 'Jika ada 2 benda lalu ditambah 3 benda, jumlahnya menjadi 5 benda.',
                        'level' => 'guidance',
                    ], JSON_THROW_ON_ERROR)],
                ]],
            ]),
        ]);

        $user = User::factory()->create();
        $turn = [
            'question' => 'Bagaimana cara menjumlahkan?',
            'answer' => 'Saya gabungkan lalu hitung semuanya.',
            'rubric' => [
                'concept_accuracy' => 'accurate',
                'calculation_accuracy' => 'accurate',
                'completeness' => 'complete',
                'example_quality' => 'relevant',
                'reasoning_consistency' => 'consistent',
            ],
        ];
        $session = GuruModeSession::query()->create([
            'user_id' => $user->id,
            'grade' => 1,
            'material_key' => 'addition-to-20',
            'material_title' => 'Penjumlahan sampai 20',
            'status' => 'active',
            'turns' => [$turn, $turn, $turn],
            'current_question' => 'Apa contoh lainnya?',
        ]);

        $this->actingAs($user)
            ->postJson("/guru-sessions/{$session->id}/complete")
            ->assertOk()
            ->assertJsonPath('evaluation.level', 'strong');

        $this->assertDatabaseHas('guru_mode_sessions', [
            'id' => $session->id,
            'status' => 'completed',
            'understanding_level' => 'strong',
        ]);
    }
}
