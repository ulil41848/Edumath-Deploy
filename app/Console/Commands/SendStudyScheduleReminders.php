<?php
namespace App\Console\Commands;
use App\Models\CourseStudySchedule;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;
class SendStudyScheduleReminders extends Command {
    protected $signature = 'edumath:send-study-reminders';
    protected $description = 'Mengirim pengingat email untuk jadwal belajar EduMath yang akan dimulai';
    public function handle(): int {
        $now=now();
        $items=CourseStudySchedule::whereNull('reminder_sent_at')->whereBetween('starts_at',[$now,$now->copy()->addMinutes(61)])->orderBy('starts_at')->get();
        foreach($items as $item) {
            if ($now->lt($item->starts_at->copy()->subMinutes($item->reminder_minutes))) continue;
            try {
                Mail::raw("Halo! Ini pengingat belajar EduMath.\n\nMateri: {$item->material_title} (Semester {$item->semester})\nWaktu: {$item->starts_at->format('d-m-Y H:i')}\nDurasi: {$item->duration_minutes} menit\n\nSelamat belajar!", function($message) use ($item) {
                    $message->to($item->reminder_email)->subject('Pengingat Jadwal Belajar EduMath');
                });
                $item->forceFill(['reminder_sent_at'=>now()])->save();
                $this->info('Pengingat terkirim untuk jadwal #'.$item->id);
            } catch (Throwable $e) { report($e); $this->error('Gagal mengirim pengingat untuk jadwal #'.$item->id); }
        }
        return self::SUCCESS;
    }
}
