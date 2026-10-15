<?php
namespace App\Http\Controllers;
use App\Models\CourseStudySchedule;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
class CourseStudyScheduleController extends Controller {
    public function index(Request $request) {
        return response()->json(['schedules'=>$request->user()->courseStudySchedules()->where('starts_at','>=',now()->subDay())->orderBy('starts_at')->get()]);
    }
    public function store(Request $request) {
        $data=$request->validate([
            'material_title'=>['required','string','max:160',Rule::in(['Penjumlahan','Pengurangan','Soal Cerita Penjumlahan dan Pengurangan','Perkalian','Pembagian','Soal Cerita Perkalian dan Pembagian'])],
            'semester'=>['required','integer',Rule::in([1,2])],
            'starts_at'=>['required','date','after:now'],
            'duration_minutes'=>['required','integer','min:10','max:240'],
            'reminder_email'=>['required','email','max:254'],
            'reminder_minutes'=>['required','integer',Rule::in([5,10,15,30,60])],
        ]);
        if (($data['semester']===1 && !in_array($data['material_title'],['Penjumlahan','Pengurangan','Soal Cerita Penjumlahan dan Pengurangan'],true)) || ($data['semester']===2 && !in_array($data['material_title'],['Perkalian','Pembagian','Soal Cerita Perkalian dan Pembagian'],true))) {
            return response()->json(['message'=>'Materi tidak sesuai dengan semester yang dipilih.'],422);
        }
        $schedule=$request->user()->courseStudySchedules()->create($data);
        return response()->json(['message'=>'Jadwal belajar berhasil disimpan. Pengingat email akan diproses oleh scheduler Laravel.','schedule'=>$schedule],201);
    }
    public function destroy(Request $request, CourseStudySchedule $schedule) {
        abort_unless($schedule->user_id===$request->user()->id,403);
        $schedule->delete(); return response()->json(['message'=>'Jadwal dihapus.']);
    }
}
