BEGIN;

-- Data demo berdasarkan ekspor 45 fasilitas milik proyek Fivora.
-- Kapasitas yang sebelumnya kosong memakai nilai simulasi, bukan batas resmi kampus.
-- Hanya mengubah tipe, lokasi, kapasitas, deskripsi, dan versi updated_at.
-- ID, nama, status, laporan, reservasi, serta riwayat perbaikan tetap dipertahankan.
CREATE TEMP TABLE fivora_facility_cleanup ON COMMIT DROP AS
SELECT (entry->>'id')::BIGINT AS id,
       entry->>'name' AS name,
       entry->'before' AS before_data,
       entry->'after' AS after_data
FROM jsonb_array_elements($fivora_data$
[
  {
    "id": 1,
    "name": "Ruang Kelas A101",
    "before": {
      "type": "ruang_kelas",
      "location": "Gedung A Lt. 1",
      "capacity": 40,
      "description": "Ruang kelas ber-AC dengan proyektor dan papan tulis."
    },
    "after": {
      "type": "Ruang Kelas",
      "location": "Gedung A, Lantai 1",
      "capacity": 40,
      "description": "Ruang perkuliahan dengan AC, proyektor, dan papan tulis untuk kegiatan belajar di kelas."
    }
  },
  {
    "id": 2,
    "name": "Laboratorium Komputer 1",
    "before": {
      "type": "laboratorium",
      "location": "Gedung C Lt. 2",
      "capacity": 30,
      "description": "Laboratorium komputer lengkap dengan 30 PC workstation."
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung C, Lantai 2",
      "capacity": 30,
      "description": "Laboratorium dengan 30 komputer untuk praktikum, pelatihan perangkat lunak, dan kegiatan pembelajaran."
    }
  },
  {
    "id": 3,
    "name": "Aula Gedung B",
    "before": {
      "type": "aula",
      "location": "Gedung B Lt. 3",
      "capacity": 200,
      "description": "Aula serbaguna dengan panggung dan sound system."
    },
    "after": {
      "type": "Aula",
      "location": "Gedung B, Lantai 3",
      "capacity": 200,
      "description": "Aula dengan panggung dan sistem suara untuk seminar, pertemuan, dan kegiatan kampus."
    }
  },
  {
    "id": 4,
    "name": "Lapangan Futsal",
    "before": {
      "type": "lapangan",
      "location": "Area Olahraga Outdoor",
      "capacity": 20,
      "description": "Lapangan futsal rumput sintetis."
    },
    "after": {
      "type": "Lapangan",
      "location": "Area Olahraga Outdoor",
      "capacity": 20,
      "description": "Lapangan futsal berumput sintetis untuk latihan dan pertandingan."
    }
  },
  {
    "id": 5,
    "name": "Proyektor Portable Unit 1",
    "before": {
      "type": "alat",
      "location": "Ruang Perlengkapan Lt. 1",
      "capacity": 1,
      "description": "Proyektor portable Epson 3600 lumens beserta kabel HDMI."
    },
    "after": {
      "type": "Lainnya",
      "location": "Ruang Perlengkapan, Lantai 1",
      "capacity": 1,
      "description": "Satu unit proyektor portabel Epson 3.600 lumen dengan koneksi HDMI untuk presentasi dan kegiatan belajar."
    }
  },
  {
    "id": 7,
    "name": "Ruang Kelas A.3.11 FIB - UNDIP",
    "before": {
      "type": "Ruang Kelas",
      "location": "Gedung A, FIB UNDIP, Tembalang",
      "capacity": null,
      "description": "Ruang kuliah dengan kode A.3.11. Referensi: https://fib.undip.ac.id/fasilitas-2/"
    },
    "after": {
      "type": "Ruang Kelas",
      "location": "Ruang A.3.11, Gedung A, Fakultas Ilmu Budaya UNDIP, Tembalang, Semarang",
      "capacity": 40,
      "description": "Ruang perkuliahan untuk pembelajaran di kelas, presentasi, dan diskusi akademik."
    }
  },
  {
    "id": 8,
    "name": "Auditorium FPIK - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung I, FPIK UNDIP, Tembalang",
      "capacity": null,
      "description": "Auditorium fakultas. Referensi: https://fpik.undip.ac.id/sarana-prasarana/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung I, Fakultas Perikanan dan Ilmu Kelautan UNDIP, Tembalang, Semarang",
      "capacity": 200,
      "description": "Auditorium untuk seminar, kuliah tamu, dan pertemuan fakultas."
    }
  },
  {
    "id": 9,
    "name": "Ruang Sidang Lantai 1 Teknik Sipil - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung E, lantai 1, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Ruang sidang lantai pertama. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Lainnya",
      "location": "Gedung E, Lantai 1, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 20,
      "description": "Ruang pertemuan untuk rapat, diskusi, dan kegiatan sidang akademik."
    }
  },
  {
    "id": 10,
    "name": "Ruang Audiovisual Gedung B FIB - UNDIP",
    "before": {
      "type": "Ruang Kelas",
      "location": "Gedung B, FIB UNDIP, Tembalang",
      "capacity": null,
      "description": "Ruang audiovisual Gedung B. Referensi: https://fib.undip.ac.id/fasilitas-2/"
    },
    "after": {
      "type": "Ruang Kelas",
      "location": "Gedung B, Fakultas Ilmu Budaya UNDIP, Tembalang, Semarang",
      "capacity": 40,
      "description": "Ruang pembelajaran untuk pemutaran materi audiovisual, presentasi, dan diskusi kelas."
    }
  },
  {
    "id": 11,
    "name": "Laboratorium Komputer FEB - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FEB UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Laboratorium praktikum dan pengolahan data. Referensi: https://feb.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung Laboratorium Komputer, Fakultas Ekonomika dan Bisnis UNDIP, Tembalang, Semarang",
      "capacity": 30,
      "description": "Laboratorium komputer untuk praktikum, pengolahan data, dan pelatihan aplikasi."
    }
  },
  {
    "id": 12,
    "name": "Lapangan Voli Teknik Sipil - UNDIP",
    "before": {
      "type": "Lapangan",
      "location": "Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Lapangan olahraga departemen. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Lapangan",
      "location": "Area Olahraga Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 12,
      "description": "Lapangan voli untuk latihan dan pertandingan antarmahasiswa."
    }
  },
  {
    "id": 13,
    "name": "Stadion UNDIP",
    "before": {
      "type": "Lapangan",
      "location": "Kampus UNDIP Tembalang, Semarang",
      "capacity": null,
      "description": "Fasilitas sepak bola dan atletik. Referensi: https://undip.ac.id/fasilitas-2"
    },
    "after": {
      "type": "Lapangan",
      "location": "Stadion UNDIP, Kampus Tembalang, Semarang",
      "capacity": 100,
      "description": "Area stadion untuk latihan sepak bola, atletik, dan kegiatan olahraga kampus."
    }
  },
  {
    "id": 14,
    "name": "Lapangan Futsal Teknik Sipil - UNDIP",
    "before": {
      "type": "Lapangan",
      "location": "Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Lapangan olahraga departemen. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Lapangan",
      "location": "Area Olahraga Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 20,
      "description": "Lapangan futsal untuk latihan dan pertandingan."
    }
  },
  {
    "id": 15,
    "name": "Laboratorium Mekanika Tanah Teknik Sipil - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "Gedung B, lantai 1, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Laboratorium bidang mekanika tanah. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung B, Lantai 1, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium praktikum untuk mempelajari sifat tanah dan penerapannya dalam pekerjaan teknik sipil."
    }
  },
  {
    "id": 16,
    "name": "Hall Pertamina FEB - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung Dekanat, lantai 3, FEB UNDIP, Tembalang",
      "capacity": null,
      "description": "Hall fakultas; sumber menyebut kapasitas lebih dari 150 orang, bukan angka maksimum pasti. Referensi: https://feb.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung Dekanat, Lantai 3, Fakultas Ekonomika dan Bisnis UNDIP, Tembalang, Semarang",
      "capacity": 150,
      "description": "Hall untuk seminar, kuliah tamu, dan kegiatan fakultas."
    }
  },
  {
    "id": 17,
    "name": "GOR Basket Prof. Dr. dr. Susilo Wibowo - UNDIP",
    "before": {
      "type": "Lapangan",
      "location": "Timur Stadion UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Fasilitas basket indoor. Angka 900 di sumber adalah kapasitas tribun, bukan jumlah pemain; kolom kapasitas dikosongkan. Referensi: https://undip.ac.id/fasilitas-2"
    },
    "after": {
      "type": "Lapangan",
      "location": "GOR Basket, Sisi Timur Stadion UNDIP, Kampus Tembalang, Semarang",
      "capacity": 40,
      "description": "Lapangan basket dalam gedung untuk latihan dan pertandingan."
    }
  },
  {
    "id": 18,
    "name": "Laboratorium Refinitiv FEB - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FEB UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Laboratorium data pasar finansial. Referensi: https://feb.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Area Fakultas Ekonomika dan Bisnis UNDIP, Kampus Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium untuk pembelajaran dan analisis data pasar keuangan melalui Refinitiv."
    }
  },
  {
    "id": 19,
    "name": "Lapangan Futsal dan Basket FSM - UNDIP",
    "before": {
      "type": "Lapangan",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Satu fasilitas bersama untuk futsal dan basket; tidak dipisah menjadi dua unit. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Lapangan",
      "location": "Area Olahraga Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 20,
      "description": "Lapangan bersama untuk latihan dan pertandingan futsal maupun basket."
    }
  },
  {
    "id": 20,
    "name": "Laboratorium Elektronika dan Instrumentasi Fisika - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Laboratorium ELINS Departemen Fisika. Referensi: https://fisika.fsm.undip.ac.id/v2/laboratorium-elektronika-dan-instrumentasi/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Area Departemen Fisika, Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium praktikum dan penelitian di bidang elektronika, sensor, serta instrumentasi."
    }
  },
  {
    "id": 21,
    "name": "Laboratorium Komputasi Teknik Sipil - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "Gedung D, lantai 2, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Laboratorium bidang komputasi. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung D, Lantai 2, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 30,
      "description": "Laboratorium untuk praktikum komputasi dan penggunaan perangkat lunak teknik sipil."
    }
  },
  {
    "id": 22,
    "name": "Lab Informatika D - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Laboratorium komputer Departemen Informatika. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Area Departemen Informatika, Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 30,
      "description": "Laboratorium komputer untuk praktikum pemrograman dan pembelajaran informatika."
    }
  },
  {
    "id": 23,
    "name": "Ruang Sidang Informatika - UNDIP",
    "before": {
      "type": "Aula",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Ruang sidang Departemen Informatika. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Lainnya",
      "location": "Area Departemen Informatika, Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 20,
      "description": "Ruang sidang untuk ujian akademik, rapat, dan presentasi."
    }
  },
  {
    "id": 24,
    "name": "Studio Gambar Teknik Sipil - UNDIP",
    "before": {
      "type": "Ruang Kelas",
      "location": "Gedung C, Teknik Sipil UNDIP, Tembalang",
      "capacity": null,
      "description": "Studio pembelajaran gambar. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Ruang Kelas",
      "location": "Gedung C, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 40,
      "description": "Studio untuk pembelajaran gambar teknik dan penyusunan rancangan konstruksi."
    }
  },
  {
    "id": 25,
    "name": "Aula GSG FIB - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung C, FIB UNDIP, Tembalang",
      "capacity": null,
      "description": "Aula gedung serbaguna fakultas. Referensi: https://fib.undip.ac.id/fasilitas-2/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung C, Fakultas Ilmu Budaya UNDIP, Tembalang, Semarang",
      "capacity": 200,
      "description": "Aula gedung serbaguna untuk pertemuan dan kegiatan mahasiswa."
    }
  },
  {
    "id": 26,
    "name": "Lab Informatika C - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Laboratorium komputer Departemen Informatika. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Area Departemen Informatika, Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 30,
      "description": "Laboratorium komputer untuk praktikum dan kegiatan pembelajaran informatika."
    }
  },
  {
    "id": 27,
    "name": "Ruang Diskusi Mahasiswa Informatika - UNDIP",
    "before": {
      "type": "Ruang Kelas",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Ruang diskusi mahasiswa; nomor ruang belum dicantumkan dalam sumber. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Lainnya",
      "location": "Area Departemen Informatika, Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 20,
      "description": "Ruang diskusi untuk belajar kelompok, membahas tugas, dan mengerjakan proyek mahasiswa."
    }
  },
  {
    "id": 28,
    "name": "Lapangan Voli FSM - UNDIP",
    "before": {
      "type": "Lapangan",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Lapangan untuk kegiatan bola voli. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Lapangan",
      "location": "Area Olahraga Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 12,
      "description": "Lapangan voli untuk latihan dan kegiatan olahraga mahasiswa."
    }
  },
  {
    "id": 29,
    "name": "Workshop Perikanan Tangkap FPIK - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FPIK UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Workshop bidang perikanan tangkap. Referensi: https://fpik.undip.ac.id/sarana-prasarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Area Fakultas Perikanan dan Ilmu Kelautan UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Workshop untuk praktikum dan kegiatan pembelajaran perikanan tangkap."
    }
  },
  {
    "id": 30,
    "name": "Gedung Tenis UNDIP",
    "before": {
      "type": "Lapangan",
      "location": "Kampus UNDIP Tembalang, Semarang",
      "capacity": null,
      "description": "Fasilitas olahraga tenis. Referensi: https://undip.ac.id/fasilitas-2"
    },
    "after": {
      "type": "Lapangan",
      "location": "Gedung Tenis UNDIP, Kampus Tembalang, Semarang",
      "capacity": 12,
      "description": "Lapangan tenis dalam gedung untuk latihan dan pertandingan."
    }
  },
  {
    "id": 31,
    "name": "Bloomberg Market Financial Laboratory FEB - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FEB UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Laboratorium keuangan dengan 12 terminal Bloomberg; jumlah terminal bukan kapasitas orang. Referensi: https://feb.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Area Fakultas Ekonomika dan Bisnis UNDIP, Kampus Tembalang, Semarang",
      "capacity": 12,
      "description": "Laboratorium keuangan untuk pembelajaran, riset pasar, dan analisis data melalui Bloomberg."
    }
  },
  {
    "id": 32,
    "name": "Muladi Dome - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Kampus UNDIP Tembalang, Semarang",
      "capacity": null,
      "description": "Gedung serbaguna untuk kegiatan kampus. Referensi: https://undip.ac.id/fasilitas-2"
    },
    "after": {
      "type": "Aula",
      "location": "Muladi Dome, Kampus UNDIP Tembalang, Semarang",
      "capacity": 4500,
      "description": "Gedung serbaguna untuk seminar, pameran, dan kegiatan besar kampus."
    }
  },
  {
    "id": 33,
    "name": "Ruang Seminar FIB - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung D, FIB UNDIP, Tembalang",
      "capacity": null,
      "description": "Ruang seminar; nomor ruang belum disebutkan dalam sumber. Referensi: https://fib.undip.ac.id/fasilitas-2/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung D, Fakultas Ilmu Budaya UNDIP, Tembalang, Semarang",
      "capacity": 50,
      "description": "Ruang seminar untuk presentasi, diskusi akademik, dan pertemuan."
    }
  },
  {
    "id": 34,
    "name": "Laboratorium Geodesi Teknik Sipil - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "Gedung D, lantai 3, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Laboratorium bidang geodesi. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung D, Lantai 3, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium untuk praktikum pengukuran, pemetaan, dan survei bidang teknik sipil."
    }
  },
  {
    "id": 35,
    "name": "Ruang Teater FIB - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung A, FIB UNDIP, Tembalang",
      "capacity": null,
      "description": "Ruang teater pada Gedung A. Referensi: https://fib.undip.ac.id/fasilitas-2/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung A, Fakultas Ilmu Budaya UNDIP, Tembalang, Semarang",
      "capacity": 100,
      "description": "Ruang teater untuk pertunjukan, pemutaran karya, dan kegiatan seni mahasiswa."
    }
  },
  {
    "id": 36,
    "name": "Laboratorium Pengaliran Teknik Sipil - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "Gedung D, lantai 1, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Laboratorium bidang pengaliran. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung D, Lantai 1, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium praktikum untuk mempelajari aliran air dan penerapannya dalam teknik sipil."
    }
  },
  {
    "id": 37,
    "name": "Hall Gedung Kewirausahaan FEB - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung Laboratorium Kewirausahaan, lantai 4, FEB UNDIP, Tembalang",
      "capacity": null,
      "description": "Hall fakultas; sumber menyebut kapasitas lebih dari 350 orang, bukan angka maksimum pasti. Referensi: https://feb.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung Laboratorium Kewirausahaan, Lantai 4, Fakultas Ekonomika dan Bisnis UNDIP, Tembalang, Semarang",
      "capacity": 350,
      "description": "Hall untuk seminar, pelatihan, dan kegiatan kewirausahaan mahasiswa."
    }
  },
  {
    "id": 38,
    "name": "Hall Gedung C FEB - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung C, lantai 4, FEB UNDIP, Tembalang",
      "capacity": null,
      "description": "Hall fakultas; sumber menyebut kapasitas lebih dari 170 orang, bukan angka maksimum pasti. Referensi: https://feb.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung C, Lantai 4, Fakultas Ekonomika dan Bisnis UNDIP, Tembalang, Semarang",
      "capacity": 170,
      "description": "Hall untuk seminar, pertemuan, dan kegiatan akademik fakultas."
    }
  },
  {
    "id": 39,
    "name": "Laboratorium Transportasi Teknik Sipil - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "Gedung D, lantai 1 dan 2, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Laboratorium bidang transportasi. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung D, Lantai 1 dan 2, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium untuk praktikum dan penelitian di bidang lalu lintas serta transportasi."
    }
  },
  {
    "id": 40,
    "name": "Coworking Space Informatika - UNDIP",
    "before": {
      "type": "Ruang Kelas",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Area kerja bersama Departemen Informatika. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Lainnya",
      "location": "Area Departemen Informatika, Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 30,
      "description": "Area kerja bersama untuk belajar, diskusi, dan pengerjaan proyek mahasiswa."
    }
  },
  {
    "id": 41,
    "name": "Aula Gedung A Teknik Sipil - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung A, Teknik Sipil UNDIP, Tembalang",
      "capacity": null,
      "description": "Aula kegiatan akademik. Sumber menyebut kapasitas sekitar 300 orang; angka pasti belum dikonfirmasi. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung A, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 300,
      "description": "Aula untuk seminar, kuliah tamu, dan kegiatan akademik departemen."
    }
  },
  {
    "id": 42,
    "name": "Lab Informatika B - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "FSM UNDIP, Tembalang, Semarang",
      "capacity": null,
      "description": "Laboratorium komputer Departemen Informatika. Referensi: https://if.undip.ac.id/fasilitas/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Area Departemen Informatika, Fakultas Sains dan Matematika UNDIP, Tembalang, Semarang",
      "capacity": 30,
      "description": "Laboratorium komputer untuk praktikum pemrograman dan pembelajaran informatika."
    }
  },
  {
    "id": 43,
    "name": "Ruang Sidang Utama Teknik Sipil - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung E, Teknik Sipil UNDIP, Tembalang",
      "capacity": null,
      "description": "Ruang sidang utama departemen. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Lainnya",
      "location": "Gedung E, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 40,
      "description": "Ruang sidang utama untuk rapat, presentasi, dan kegiatan sidang akademik."
    }
  },
  {
    "id": 44,
    "name": "Laboratorium Manajemen Konstruksi Teknik Sipil - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "Gedung D, lantai 3, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Laboratorium bidang manajemen konstruksi. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung D, Lantai 3, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium untuk pembelajaran perencanaan, pengendalian, dan pengelolaan proyek konstruksi."
    }
  },
  {
    "id": 45,
    "name": "Hall Art Center FIB - UNDIP",
    "before": {
      "type": "Aula",
      "location": "Gedung E, FIB UNDIP, Tembalang",
      "capacity": null,
      "description": "Hall pusat kegiatan seni fakultas. Referensi: https://fib.undip.ac.id/fasilitas-2/"
    },
    "after": {
      "type": "Aula",
      "location": "Gedung E, Fakultas Ilmu Budaya UNDIP, Tembalang, Semarang",
      "capacity": 150,
      "description": "Hall pusat kegiatan seni untuk pertunjukan, latihan, dan kegiatan mahasiswa."
    }
  },
  {
    "id": 46,
    "name": "Laboratorium Bahan dan Konstruksi Teknik Sipil - UNDIP",
    "before": {
      "type": "Laboratorium",
      "location": "Gedung D, lantai 1, Teknik Sipil UNDIP",
      "capacity": null,
      "description": "Laboratorium bidang bahan dan konstruksi. Referensi: https://sipil.undip.ac.id/prasarana-dan-sarana/"
    },
    "after": {
      "type": "Laboratorium",
      "location": "Gedung D, Lantai 1, Departemen Teknik Sipil UNDIP, Tembalang, Semarang",
      "capacity": 24,
      "description": "Laboratorium untuk praktikum dan pengujian bahan serta konstruksi."
    }
  }
]
$fivora_data$::JSONB) AS entry;

DO $$
DECLARE v_conflict TEXT;
BEGIN
  -- Kunci sebelum memeriksa agar perubahan admin tidak tertimpa saat penyimpanan.
  PERFORM f.id FROM public.facilities AS f
  JOIN fivora_facility_cleanup AS c ON c.id = f.id
  ORDER BY f.id FOR UPDATE OF f;

  SELECT string_agg(c.id::TEXT, ', ' ORDER BY c.id) INTO v_conflict
  FROM fivora_facility_cleanup AS c
  LEFT JOIN public.facilities AS f ON f.id = c.id
  WHERE f.id IS NULL OR f.name IS DISTINCT FROM c.name;
  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION 'ID atau nama fasilitas berbeda dari ekspor: %. Tidak ada data yang diubah.', v_conflict;
  END IF;

  SELECT string_agg(c.id::TEXT, ', ' ORDER BY c.id) INTO v_conflict
  FROM fivora_facility_cleanup AS c
  JOIN public.facilities AS f ON f.id = c.id
  WHERE NOT (
    public.normalize_facility_type(f.type) IN (
      public.normalize_facility_type(c.before_data->>'type'), c.after_data->>'type'
    )
    AND (to_jsonb(f.location) IS NOT DISTINCT FROM c.before_data->'location'
      OR to_jsonb(f.location) IS NOT DISTINCT FROM c.after_data->'location')
    AND (coalesce(to_jsonb(f.capacity), 'null'::JSONB) = c.before_data->'capacity'
      OR coalesce(to_jsonb(f.capacity), 'null'::JSONB) = c.after_data->'capacity')
    AND (to_jsonb(f.description) IS NOT DISTINCT FROM c.before_data->'description'
      OR to_jsonb(f.description) IS NOT DISTINCT FROM c.after_data->'description')
  ) IS TRUE;
  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION 'Rincian fasilitas sudah berubah sejak ekspor: %. Ekspor ulang sebelum melanjutkan. Tidak ada data yang diubah.', v_conflict;
  END IF;
END;
$$;

UPDATE public.facilities AS f
SET type = c.after_data->>'type',
    location = c.after_data->>'location',
    capacity = (c.after_data->>'capacity')::INTEGER,
    description = c.after_data->>'description',
    updated_at = clock_timestamp()
FROM fivora_facility_cleanup AS c
WHERE f.id = c.id AND f.name = c.name
  AND jsonb_build_object('type', f.type, 'location', f.location,
    'capacity', f.capacity, 'description', f.description) IS DISTINCT FROM c.after_data;

COMMIT;

-- Hasil akhir: fasilitas_diperiksa = 45, kapasitas_terisi = 45,
-- kapasitas_kosong = 0, variasi_tipe = 5, deskripsi_dengan_tautan = 0.
SELECT count(*) AS fasilitas_diperiksa,
       count(capacity) AS kapasitas_terisi,
       count(*) FILTER (WHERE capacity IS NULL) AS kapasitas_kosong,
       count(DISTINCT type) AS variasi_tipe,
       count(*) FILTER (WHERE description ~* 'https?://|referensi:') AS deskripsi_dengan_tautan
FROM public.facilities
WHERE id IN (1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46);
