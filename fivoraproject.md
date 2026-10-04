modul kerja

sp yg ngerjain

modul

user story

apa aja yg dikerjain

alyssa

akun, autentikasi,

13-15 + autentikasi

register, login,

hak akses

(yg wajib dr dosen)

logout, role, verif

akun

Bagas

reservasi, pengguna

3-5,8-10

pengajuan, jadwal,

dan pemrosesan

petugas

bentrok, persetujuan,

pembatalan

arin

laporan kerusakan

6-8, 11-12

laporan, foto,

dan perbaikan

pemrosesan, status

perbaikan

eve

fasilitas,

1-2, 16-17

data fasilitas,

ketersediaan, dan

rekap

pencarian,

availability, rekap,

ekspor

1.  akun

fitur pengguna:

●  Registrasi mahasiswa/dosen/staf

●  Login

●  Logout

●  Pesan jika akun belum diverifikasi atau ditolak

●  Pengalihan halaman berdasarkan role

fitur admin:

●  Melihat pendaftaran yang menunggu

●  Menyetujui atau menolak registrasi

●  Membuat akun pengguna secara langsung

●  Membuat akun petugas secara langsung

●  Melihat daftar akun

logika dan validasi:

●  Email tidak boleh digunakan lebih dari satu akun

●  Registrasi publik hanya menghasilkan role pengguna

●  Akun hasil registrasi berstatus menunggu

●  Akun belum terverifikasi tidak dapat login

●  Akun buatan admin langsung aktif

●  Password disimpan secara aman

●  Halaman pengguna, petugas, dan admin dilindungi berdasarkan role

data utama: users minimal ada:

●  ID

●  Nama

●  Email

●  Password

●  Jenis pengguna: mahasiswa/dosen/staf

●  Role: pengguna/petugas/admin

●  Status akun: menunggu/aktif/ditolak

●  Waktu pembuatan akun

tambahan:

●  Menyiapkan mekanisme session/auth yang digunakan semua modul

●  Menyiapkan proteksi halaman berdasarkan role

●  Menjelaskan kepada anggota lain cara mengambil ID dan role pengguna yang sedang

login

●  Menulis petunjuk login dan akun demo untuk dokumentasi

target:  Pengunjung  dapat  register,  admin  dapat  memverifikasi  akun,  pengguna  aktif

dapat login, dan setiap role hanya dapat membuka halaman yang sesuai.

2.  reservasi

fitur pengguna:

●  Memilih fasilitas, tanggal, waktu mulai, dan waktu selesai

●  Mengisi tujuan penggunaan

●  Mengajukan reservasi

●  Melihat detail, status, dan riwayat reservasi sendiri

●  Membatalkan reservasi sendiri sesuai batas tiga jam

fitur petugas:

●  Melihat antrean reservasi

●  Mengurutkan pengajuan berdasarkan waktu pengajuan

●  Melihat detail pengajuan

●  Menyetujui atau menolak reservasi

●  Memberikan alasan penolakan

●  Membatalkan reservasi yang sudah disetujui dalam kondisi mendesak

●  Memberikan alasan pembatalan

logika dan validasi:

●  Jam operasional 07.00–20.00 WIB

●  Kelipatan waktu 30 menit

●  Durasi minimal 30 menit

●  Tidak melintasi tanggal

●  Waktu mulai belum lewat

●  Satu pengguna tidak memiliki reservasi yang waktunya bertabrakan — berlaku juga di fasilitas yang berbeda pada waktu yang sama (tidak boleh pesan 2 fasilitas beda di waktu sama untuk 1 akun)

●  Reservasi hari yang sama: waktu mulai harus lebih besar dari waktu pengajuan, dibulatkan ke kelipatan 30 menit ke atas (ajukan 10.10 → slot terawal 10.30)

●  Durasi maksimal satu pengajuan mengikuti sisa jam operasional pada tanggal tersebut

●  Reservasi tidak dapat diedit — perubahan = batalkan reservasi lama lalu buat pengajuan baru

●  Reservasi menunggu belum mengunci slot

●  Reservasi disetujui mengunci slot

●  Tidak ada dua reservasi disetujui yang bertabrakan

●  Pengecekan bentrok diulang ketika petugas menyetujui

●  Pengajuan bentrok lain otomatis ditolak setelah salah satunya disetujui (alasan: "jadwal telah terisi")

●  Reservasi kedaluwarsa: pengajuan menunggu yang waktu mulainya sudah lewat tidak dapat disetujui dan otomatis ditolak (alasan: "waktu mulai reservasi telah terlewati")

●  Keterangan sudah berlalu dihitung dari waktu selesai tanpa mengubah status

●  Pengguna hanya bisa membatalkan reservasi miliknya sendiri berstatus menunggu/disetujui, paling lambat 3 jam sebelum waktu mulai (tepat 3 jam masih boleh) — ketentuan ini ditampilkan sebelum pengajuan dikirim

data  utama:  reservations  relasinya  ke  users,  facilities,  dan  petugas  yg

memproses reservasi

bakal koordinasi sm alyssa uuntuk identitas pengguna dan petugas, arin untuk fasilitas dlm

perbaikan, 4 untuk data fasilitas dan tampilan ketersediaan

target:  Pengguna  dapat  mengajukan  sampai  membatalkan  reservasi,  petugas  dapat

memprosesnya, dan sistem selalu mencegah persetujuan jadwal yang bentrok.

3.  laporan

fitur pengguna:

●  Memilih fasilitas yang dilaporkan

●  Memilih kategori kerusakan

●  Menulis deskripsi

●  Mengunggah satu foto

●  Melihat detail dan status laporan sendiri

fitur petugas:

●  Melihat antrean laporan

●  Membuka detail dan foto laporan

●  Mengubah laporan dari baru menjadi diproses

●  Menolak laporan dengan catatan

●  Menyelesaikan laporan dengan catatan resolusi

●  Menandai laporan duplikat

●  Menandai fasilitas dalam perbaikan

●  Mengaktifkan kembali fasilitas setelah layak digunakan

logika dan validasi:

●  Foto wajib

●  Format JPG, JPEG, atau PNG

●  Ukuran maksimal 2 MB

●  Validasi foto di client dan server

●  Alur status baru → diproses → selesai

●  Alternatif alur baru → ditolak

●  Laporan selesai atau ditolak wajib memiliki catatan

●  Laporan yang sudah ditutup tidak dapat dibuka kembali

●  Laporan tidak otomatis membuat fasilitas masuk perbaikan

●  Fasilitas tetap dalam perbaikan sampai diaktifkan kembali petugas

●  Perubahan status perbaikan memengaruhi reservasi yang belum selesai

data utama: reports, minimal ada:

●  ID pelapor

●  ID fasilitas

●  Kategori

●  Deskripsi

●  Lokasi/path foto

●  Status

●  Catatan petugas

●  Petugas yang memproses

●  Waktu pengajuan dan pemrosesan

bakal  koordinasi  sm:  alyssa  untuk  identitas  pelapor  dan  petugas,  2  untuk  reservasi  yg

terdampak perbaikan, 4 untuk status data dan fasilitas

target:  Pengguna  dapat  mengirim  dan  memantau

laporan,  petugas  dapat

menyelesaikan  seluruh  alurnya,  dan  status  perbaikan

fasilitas  memengaruhi

pemesanan.

4.  fasilitas

fitur publik:

●  Melihat daftar dan detail fasilitas tanpa login

●  Mencari fasilitas

●  Filter berdasarkan tipe, lokasi, dan kapasitas

●  Melihat ketersediaan per slot

●  Tidak menampilkan identitas pemesan atau tujuan penggunaan

fitur admin:

●  Menambah fasilitas

●  Mengedit fasilitas

●  Menonaktifkan fasilitas

●  Melihat reservasi yang harus diselesaikan sebelum fasilitas dinonaktifkan

●  Melihat fasilitas aktif, nonaktif, dan dalam perbaikan

rekap:

●  Filter berdasarkan rentang tanggal

●  Filter berdasarkan fasilitas atau lokasi

●  Menghitung okupansi berdasarkan reservasi disetujui

●  Menghitung frekuensi laporan valid

●  Menampilkan 0% dan tidak ada data secara tepat

●  Mengekspor hasil rekap dalam minimal satu format pilihan: CSV, Excel, atau PDF

data utama: facilites, minimal ada:

●  ID

●  Nama

●  Tipe

●  Lokasi

●  Kapasitas

●  Deskripsi

●  Status aktif/nonaktif

●  Status perbaikan

●  Tanggal fasilitas ditambahkan

bakal koordinasi sm: alyssa untuk pembatasan akses admin, 2 untuk slot data dan reservasi,

arin untuk status perbaikan dan laporan kerusakan

target:  Pengunjung  dapat  mencari  dan  melihat  ketersediaan  fasilitas,  admin  dapat

mengelola fasilitas, serta rekap dapat dihitung, difilter, dan diekspor.

user story masing2 role

1.  Akses Pengunjung dan Pencarian Fasilitas (US 1–2)

●

 Pengunjung dapat melihat daftar fasilitas dan ketersediaan per slot tanpa

login.

●

Informasi publik hanya menunjukkan tersedia/tidak tersedia, tanpa detail

pemohon atau tujuan penggunaan.

●  Fasilitas dapat dicari berdasarkan tipe, lokasi, dan kapasitas.

2.  reservasi pengguna (US 3-5)

●  Pengguna dapat mengajukan reservasi pada rentang waktu tertentu dengan

mencantumkan tujuan penggunaan.

●  Pengguna dapat membatalkan reservasinya sendiri sebelum batas waktu

tertentu.

●  Pengguna dapat melihat riwayat, status, dan detail lengkap reservasinya

sendiri.

3.  pelaporan oleh pengguna (US 6-7)

●  Pengguna dapat melaporkan masalah pada fasilitas tertentu dengan kategori,

deskripsi, dan foto.

●  Pengguna dapat melihat status laporannya sendiri.

4.  pemrosesan oleh petugas (US 8-12)

●  Petugas dapat melihat dashboard atau antrean reservasi dan laporan yang

menunggu diproses.

●  Petugas menyetujui atau menolak reservasi secara manual.

●  Sistem wajib mencegah persetujuan reservasi yang jadwalnya bentrok pada

fasilitas yang sama.

●  Petugas dapat membatalkan reservasi disetujui dalam kondisi mendesak

dengan mencantumkan alasan.

●  Petugas dapat mengubah status laporan menjadi baru, diproses, selesai, atau

ditolak, disertai catatan resolusi saat laporan ditutup.

●  Petugas dapat menandai fasilitas dalam perbaikan berdasarkan laporan yang

ditangani dan mengembalikannya ke status aktif setelah selesai diperbaiki.

5.  pengelolaan oleh admin (US 13-17)

●  Admin dapat membuat akun petugas secara langsung. Petugas tidak

melakukan registrasi mandiri dalam kondisi apa pun.

●  Admin dapat membuat akun pengguna mahasiswa/dosen/staf secara langsung.

●  Admin dapat memverifikasi atau menolak registrasi mandiri pengguna, jika

fitur tersebut diimplementasikan, sebelum akun dapat digunakan untuk login.

●  Admin dapat menambah, mengedit, dan menonaktifkan fasilitas.

●  Admin dapat melihat dan mengekspor rekap okupansi serta frekuensi

kerusakan per fasilitas/lokasi. Format yang disebut dalam instruksi adalah

CSV/Excel/PDF.

aturan dari dosen

1.  aturan implementasi

●  Sistem memiliki autentikasi berupa registrasi, login, dan logout.

●  Kode minimal memisahkan koneksi database, tampilan, dan logika proses.

●  Form penting harus divalidasi di sisi server dan client.

●  Tampilan harus mudah digunakan.

●  Minimal terdapat pembagian folder /public, /app untuk model/controller,

/Views, dan /config.

2.  waktu reservasi

●  Jam operasional adalah 07.00–20.00.

●  Reservasi menggunakan slot waktu tetap berdurasi 30 menit.

●  Waktu mulai dan selesai wajib berada dalam jam operasional serta mengikuti

kelipatan slot 30 menit.

●  Validasi waktu wajib dilakukan di sisi server, bukan hanya melalui tampilan

kalender.

asumsi tambahan

1.

Hari Operasional dan Zona

Waktu

2.

Waktu Pengajuan

Reservasi

●  Reservasi  tersedia  setiap  hari,  termasuk

Sabtu  dan  Minggu,  pukul  07.00–20.00

WIB.

●  Seluruh  waktu  pada  sistem,

termasuk

batas pembatalan, menggunakan WIB.

●  Sistem

belum  menerapkan  kalender

khusus untuk hari libur.

●  Pengguna boleh mengajukan reservasi

untuk hari yang sama maupun tanggal

mendatang.

●  kl mau reservasi dihari yg sama dgn

pengajuan, waktu mulai reservasi harus

lebih besar dari waktu saat pengajuan. (ex:

pas pengajuan jam 12.00, berarti cm bs

reservasi buat jam 12.30 keatas sesuai dgn

kelipatan 30 menit)

●  Pilihan waktu tetap mengikuti kelipatan

30 menit. Contohnya, jika pengajuan

dilakukan pukul 10.10 WIB, waktu mulai

paling awal adalah pukul 10.30 WIB.

●  Reservasi harus dimulai dan berakhir pada

tanggal yang sama. (berarti sekali

reservasi cm bs untuk 1 hari, kl mau

reservasi >1 hari berarti pengajuannya

terpisah)

3.

Durasi Reservasi

●  Durasi minimal reservasi adalah 30 menit

dan dapat ditambah dalam kelipatan 30

menit.

●  Satu pengajuan dapat mencakup beberapa

slot berurutan. Reservasi selama dua jam

dibuat sebagai satu pengajuan yang

mencakup empat slot.

●  Durasi maksimal dalam satu pengajuan

mengikuti sisa jam operasional pada

tanggal tersebut.

●  Sistem tidak menerapkan batas total

jumlah reservasi per pengguna dalam satu

hari.

4.

Fasilitas yang Dapat

●  Hanya  fasilitas  aktif  dan  tidak  sedang

Dipesan

dalam  perbaikan  yang  dapat  diajukan

untuk reservasi.

●  Satu  fasilitas  hanya  dapat  digunakan oleh

satu  reservasi  yang  disetujui  pada  suatu

waktu.

●  Kapasitas  fasilitas  menjadi  informasi  dan

kriteria  pencarian,  bukan jumlah reservasi

yang dapat berjalan bersamaan.

●  Untuk  alat  yang  dapat  dipinjam  secara

terpisah,  setiap  unit  yang  dapat  dipesan

mandiri dicatat sebagai fasilitas tersendiri.

5.

status reservasi

●  Status  reservasi  terdiri  atas  menunggu,

disetujui, ditolak, dan dibatalkan.

●  Pengajuan

baru  memiliki

status

menunggu.

●  Persetujuan dan penolakan dilakukan oleh

petugas.

●  Berakhirnya  waktu

reservasi

tidak

otomatis  mengubah

status

disetujui

menjadi

selesai.

Sistem

cukup

menampilkan

keterangan

tambahan

“sudah  berlalu”  berdasarkan  tanggal  dan

waktu akhir reservasi.

●  Reservasi  yang  ditolak  atau  dibatalkan

tetap menyimpan status tersebut meskipun

jadwalnya sudah lewat.

6.

Reservasi Menunggu dan

●  Pengajuan  berstatus  menunggu  belum

Ketersediaan Slot

mengunci slot.

●  Beberapa  pengguna  dapat  mengajukan

reservasi  untuk  fasilitas  dan  waktu  yang

sama selama belum ada reservasi disetujui

pada waktu tersebut.

●  Sistem  menolak  pengajuan  baru  yang

waktunya  bertabrakan  dengan  reservasi

disetujui pada fasilitas yang sama.

●  Ketika

satu

pengajuan

disetujui,

pengajuan lain yang masih menunggu dan

waktunya  bertabrakan  otomatis  ditolak

dengan alasan jadwal telah terisi.

●  Sistem memeriksa kembali bentrok jadwal

saat petugas menyetujui pengajuan.

7.

Batas Bentrok Jadwal

●  Jadwal  dianggap  bentrok

jika  rentang

waktunya  beririsan  pada  fasilitas  yang

sama.

●  Reservasi  pukul  08.00–10.00  bentrok

dengan reservasi pukul 09.00–11.00.

●  Reservasi

pukul

08.00–10.00

tidak

bentrok

dengan

reservasi

pukul

10.00–11.00.

●  Sistem tidak menambahkan jeda persiapan

atau  pembersihan  antar  reservasi,  dgn

asumsi  peminjam  hrs  membersihkan  dan

merapikan

kembali

ruangan/fasilitas

setelah digunakan.

8.

Prioritas Pemrosesan

●  Pengajuan  diproses  berdasarkan  urutan

waktu  pengajuan,  terutama  untuk fasilitas

dan waktu yang beririsan.

●  Untuk

beberapa

pengajuan

yang

memperebutkan  fasilitas  dan  waktu  yang

bertabrakan,  petugas  harus  memproses

pengajuan  berdasarkan  urutan  waktu

pengajuan.

●  Petugas  dapat  menolak  pengajuan  yang

tidak  memenuhi  ketentuan  dan  wajib

memberikan alasan.

●  Sistem  tidak  menerapkan  prioritas khusus

berdasarkan  kategori  mahasiswa,  dosen,

atau staf.

9.

pengajuan yg melewati

●  Reservasi  yang  masih  menunggu  tidak

waktu mulai

dapat  disetujui  apabila  waktu  mulainya

sudah tercapai atau terlewati.

●  Pengajuan

tersebut  ditetapkan  menjadi

ditolak  dengan  alasan  waktu  mulai

reservasi telah terlewati.

10

pembatalan oleh pengguna

●  Pengguna  hanya  dapat  membatalkan

reservasinya

sendiri

yang

berstatus

menunggu atau disetujui.

●  Pembatalan dapat dilakukan paling lambat

tiga  jam  sebelum  waktu  mulai  reservasi.

Tepat tiga jam sebelum waktu mulai masih

diperbolehkan.

●  Pengajuan  yang  dibuat  kurang  dari  tiga

jam  sebelum  waktu  mulai  tidak  dapat

dibatalkan sendiri oleh pengguna.

●  Ketentuan  tersebut  ditampilkan  sebelum

pengguna mengirim pengajuan.

●  Reservasi  yang  dibatalkan  tetap  disimpan

sebagai  riwayat.  Slot  yang  sebelumnya

terisi  menjadi

tersedia  kembali

jika

fasilitas masih dapat digunakan.

11

perubahan dan duplikasi

●  Reservasi yang sudah diajukan tidak dapat

reservasi

diedit.

●  Perubahan

dilakukan

dengan

membatalkan pengajuan awal sesuai batas

pembatalan,

kemudian

membuat

pengajuan baru.

●  Pengajuan  ulang  masuk ke urutan antrean

baru.

●  Pengguna

tidak

dapat  mengajukan

reservasi  lagi  untuk  fasilitas  yang  sama

apabila  waktunya  bertabrakan  dengan

reservasi  miliknya  yang  masih  menunggu

atau sudah disetujui.

●

tidak  boleh  pesen  2  fasilitas  berbeda  di

waktu yg sama buat 1 akun

12

fasilitas dalam perbaikan

●  Status dalam perbaikan ditetapkan petugas

berdasarkan

laporan  kerusakan  yang

sedang ditangani.

●  Selama  dalam  perbaikan,  fasilitas  tidak

menerima  pengajuan  atau  persetujuan

reservasi baru.

●  Status  dalam  perbaikan  berlaku  sejak

ditetapkan  oleh  petugas  dan  tetap berlaku

sampai  petugas  mengaktifkan  kembali

fasilitas  tersebut.  Sistem  tidak  meminta

perkiraan tanggal selesai perbaikan.

●  Pengajuan  menunggu  untuk  penggunaan

mendatang  ditolak  dengan  alasan  fasilitas

dalam perbaikan.

●  Reservasi  yang  sedang  berlangsung  dapat

dihentikan oleh petugas apabila kerusakan

membuat  fasilitas  tidak  aman  atau  tidak

layak  digunakan.  Reservasi  yang  sudah

disetujui  dan  belum  dimulai  dibatalkan

dengan mencantumkan alasan.

●  Riwayat  reservasi  yang  sudah  berlalu

tidak  diubah.  Perubahan  status  fasilitas

menjadi

dalam

perbaikan

hanya

memengaruhi

reservasi  yang

sedang

berlangsung

atau

belum

dimulai.

Reservasi  yang  waktunya  sudah  lewat

tetap disimpan dengan status sebelumnya.

13

fasilitas dinonaktifkan

●  Penonaktifan  digunakan  untuk  menarik

admin

fasilitas  dari  layanan  reservasi,  misalnya

karena  fasilitas  tidak  lagi  disewakan  atau

digunakan untuk keperluan lain.

●  Fasilitas

nonaktif

tidak  menerima

pengajuan atau persetujuan reservasi baru.

●  Penonaktifan

tidak  menghapus  data

fasilitas, reservasi, maupun laporan.

●  Fasilitas

hanya

dapat  dinonaktifkan

setelah

tidak  ada  reservasi  mendatang

yang  masih menunggu atau disetujui. Jika

masih  ada,  sistem  menampilkan  daftar

reservasi  yang  harus  diselesaikan  terlebih

dahulu oleh petugas.

●  Status

aktif/nonaktif

oleh

admin

dibedakan  dari  status  perbaikan  oleh

petugas.  Menyelesaikan  perbaikan  tidak

otomatis  mengaktifkan

fasilitas  yang

dinonaktifkan admin.

●  Fasilitas  nonaktif  tidak  ditampilkan  pada

daftar pemesanan publik, tetapi tetap dapat

dilihat  melalui  riwayat  yang  berkaitan

dengannya.

14

pengajuan laporan

●  Mahasiswa,  dosen,  dan  staf  yang  sudah

kerusakan

login  sebagai  pengguna  dapat  mengirim

laporan  tanpa  harus  pernah  melakukan

reservasi pada fasilitas tersebut.

●  Laporan  mencakup

fasilitas,  kategori

kerusakan, deskripsi, dan foto.

●  Kategori  awal  meliputi  peralatan,  listrik,

kebersihan, bangunan, dan lainnya.

●  Laporan  tidak  dapat  diedit  atau  dihapus

oleh pengguna setelah dikirim.

15

foto laporan

●  Setiap laporan wajib memiliki satu foto.

●  Format  yang  diterima  adalah  JPG,  JPEG,

atau PNG dengan ukuran maksimal 2 MB.

●  Jenis  dan  ukuran  file  diperiksa  di  sisi

client dan server.

●  Foto  hanya  dapat  diakses  oleh  pemilik

laporan  serta  petugas  yang  menangani

laporan

16

pemrosesan laporan

●  Laporan baru memiliki status baru.

●  Petugas mengubah status menjadi diproses

ketika  laporan dinyatakan valid dan mulai

ditangani.

●  Status

selesai

digunakan

ketika

penanganan sudah tuntas.

●  Status  ditolak  digunakan  untuk  laporan

tidak valid, tidak relevan, atau duplikat.

●  Status  selesai  dan  ditolak  wajib  disertai

catatan petugas.

●  Laporan  yang  ditutup

tidak  dibuka

kembali.

Jika  masalah  muncul

lagi,

pengguna membuat laporan baru.

●  Laporan

kerusakan

tidak

otomatis

membuat

fasilitas  masuk  perbaikan.

Petugas  menentukan  apakah  masalah

tersebut  membuat  fasilitas  tidak  layak

digunakan.

17

beberapa laporan pada

●  Jika  beberapa

laporan  merujuk  pada

fasilitas yang sama

kejadian  kerusakan  yang  sama,  petugas

memilih

satu

laporan  utama  untuk

diproses.

●  Laporan  duplikat  ditolak  dengan  catatan

yang merujuk pada laporan utama.

●  Penyelesaian  satu  laporan  tidak  otomatis

mengakhiri status perbaikan apabila masih

ada  kerusakan

lain  yang  menghambat

penggunaan fasilitas.

●  Petugas  mengakhiri

status  perbaikan

setelah  memastikan

fasilitas

layak

digunakan.

18

registrasi dan verifikaasi

●  Registrasi mandiri disediakan hanya untuk

akun

pengguna mahasiswa, dosen, dan staf.

●  Akun  hasil  registrasi  mandiri  berstatus

menunggu  verifikasi  dan  belum  dapat

digunakan untuk login.

●  Admin  dapat  menyetujui  atau  menolak

registrasi tersebut.

●  Akun  pengguna  dan  petugas  yang  dibuat

langsung oleh admin berstatus aktif.

●  Registrasi  publik

tidak  menyediakan

pilihan role petugas atau admin.

●  Akun  admin  awal  disiapkan  melalui  data

awal  sistem,  bukan  melalui  registrasi

publik.

●  Satu  alamat  email  hanya dapat digunakan

untuk satu akun.

19

batas kewenangan aktor

●  Setiap akun memiliki satu role: pengguna,

petugas,

atau

admin.

Pengunjung

merupakan kondisi akses tanpa login.

●  Admin

tidak  memiliki

kewenangan

menyetujui

reservasi  atau  memproses

kerusakan.

tindakan

tsb  hanya  dpt

dilakukan oleh petugas

●  Petugas

tidak  memiliki  kewenangan

mengelola  akun  atau  mengubah  data

master  (utama)  seperti  nama,  lokasi,  dan

kapasitas fasilitas.

●  Pengguna  hanya  dapat  mengakses  detail

reservasi dan laporan miliknya sendiri.

●  Admin  dapat  mengakses  data  yang

diperlukan  untuk

rekap,

tetapi

tidak

mengambil  alih  pemrosesan  operasional

petugas.

20

rekap okupansi fasilitas

●  Rekap  dihitung  berdasarkan

rentang

tanggal yang dipilih admin.

●  Okupansi  mengukur  pemakaian

slot

berdasarkan  reservasi  disetujui,  bukan

penggunaan

aktual

yang  dibuktikan

dengan kehadiran.

●  Rumus yang digunakan:

Okupansi  =

(jumlah  slot  reservasi

disetujui  ÷  jumlah  slot  operasional

standar) × 100%.

●  Satu  hari  memiliki  26  slot  operasional,

masing-masing berdurasi 30 menit.

●  Reservasi  menunggu,

ditolak,

dan

dibatalkan

tidak  dihitung  sebagai  slot

terpakai.

●  Penyebut  menggunakan  26  slot  per  hari

sejak  fasilitas  tercatat  dalam  sistem  pada

periode  tersebut.  Hari  sebelum  fasilitas

tercatat tidak dihitung.

●  waktu  perbaikan  dan  penonaktifan  tidak

mengurangi  penyebut.  Rekap  diberi

keterangan

bahwa

perhitungan

menggunakan jam operasional standar.

●  Rekap  per

lokasi  dihitung  dengan

membagi

total  slot

terpesan  seluruh

fasilitas

terkait

dengan

total

slot

operasional standarnya.

●  Jika  pada  periode  yang  dipilih  tidak  ada

slot  operasional  yang  dapat  dihitung,

sistem  menampilkan  keterangan  “tidak

ada  data”.  Nilai  0%  hanya  ditampilkan

apabila  slot  operasional  tersedia,  tetapi

tidak ada reservasi yang disetujui.

21

rekap frekuensi kerusakan

●  Frekuensi kerusakan didefinisikan sebagai

dan ekspor

jumlah

laporan  valid  yang  berstatus

diproses  atau  selesai,  berdasarkan tanggal

pengajuan dalam periode rekap.

●  Laporan  baru  dan  laporan  ditolak  tidak

masuk perhitungan.

●  Rekap

dikelompokkan

berdasarkan

fasilitas dan lokasi.

●  Angka  ini  menunjukkan  jumlah  laporan

valid,  bukan jumlah komponen rusak atau

bukti  jumlah  kejadian  yang  sepenuhnya

berbeda.

●  dpt  melihat  dan  mengekspor

rekap

okupansi fasilitas dan frekuensi kerusakan

per

fasilitas/lokasi.

(bs

pake

CSV/Excel/PDF)

●  Hasil  ekspor  mengikuti  filter  dan  periode

yang dipilih admin.

22

penyimpanan riwayat

●  Reservasi  dan

laporan  yang

sudah

diproses tidak dihapus dari sistem.

●  Sistem  menyimpan  waktu  pengajuan,

petugas  yang  memproses,  serta  alasan

penolakan/pembatalan

atau

catatan

resolusi yang relevan.

●  Data  contoh  dan  akun  demo  disiapkan

untuk  setiap  role  agar  seluruh  alur  dapat

diuji dan dipresentasikan.

