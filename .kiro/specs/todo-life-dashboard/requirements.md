# Requirements Document

## Introduction

To-Do List Life Dashboard adalah aplikasi web berbasis klien yang memungkinkan pengguna mengelola tugas-tugas harian mereka dalam satu tampilan dashboard yang bersih dan intuitif. Aplikasi ini berjalan sepenuhnya di sisi klien menggunakan HTML, CSS murni, dan Vanilla JavaScript tanpa memerlukan backend server. Data pengguna disimpan secara persisten menggunakan browser Local Storage API, sehingga dapat diakses kembali setelah browser ditutup dan dibuka ulang. Aplikasi dirancang agar dapat berfungsi sebagai standalone web app maupun browser extension di browser modern (Chrome, Firefox, Edge, Safari).

---

## Glossary

- **Dashboard**: Halaman utama aplikasi yang menampilkan ringkasan semua kategori tugas sekaligus.
- **Task**: Satu item pekerjaan yang memiliki judul, status selesai/belum, prioritas, dan kategori.
- **Category**: Kelompok yang mengorganisir tugas-tugas berdasarkan aspek kehidupan (misalnya: Pekerjaan, Pribadi, Kesehatan, Belajar).
- **Local_Storage**: Browser Local Storage API yang digunakan untuk menyimpan semua data aplikasi di sisi klien.
- **Dashboard_App**: Keseluruhan aplikasi To-Do List Life Dashboard.
- **Task_Manager**: Komponen yang menangani operasi CRUD (buat, baca, perbarui, hapus) untuk tugas.
- **Category_Manager**: Komponen yang menangani pengelolaan kategori tugas.
- **Storage_Handler**: Komponen yang bertanggung jawab atas semua operasi baca/tulis ke Local_Storage.
- **UI_Renderer**: Komponen yang bertanggung jawab merender ulang tampilan saat data berubah.
- **Filter**: Mekanisme untuk menyaring tampilan tugas berdasarkan kriteria tertentu (kategori, status, prioritas).
- **Priority**: Tingkat urgensi tugas — High (tinggi), Medium (sedang), atau Low (rendah).
- **Status**: Kondisi penyelesaian tugas — Pending (belum selesai) atau Completed (selesai).

---

## Requirements

### Requirement 1: Manajemen Tugas Dasar

**User Story:** Sebagai pengguna, saya ingin membuat, melihat, memperbarui, dan menghapus tugas, agar saya dapat mengelola daftar pekerjaan saya secara efektif.

#### Acceptance Criteria

1. WHEN pengguna mengisi judul tugas dan menekan tombol simpan, THE Task_Manager SHALL membuat tugas baru dengan judul, kategori, prioritas, dan status Pending.
2. THE Dashboard_App SHALL menampilkan semua tugas yang ada pada dashboard utama segera setelah halaman dimuat.
3. WHEN pengguna mengklik tombol edit pada sebuah tugas, THE Task_Manager SHALL menampilkan form yang telah terisi data tugas tersebut untuk diubah.
4. WHEN pengguna menyimpan perubahan pada tugas yang diedit, THE Task_Manager SHALL memperbarui data tugas dengan nilai baru yang dimasukkan pengguna.
5. WHEN pengguna mengklik tombol hapus pada sebuah tugas, THE Task_Manager SHALL menghapus tugas tersebut dari daftar secara permanen.
6. IF pengguna mencoba menyimpan tugas dengan judul kosong, THEN THE Task_Manager SHALL menampilkan pesan kesalahan yang menjelaskan bahwa judul tugas tidak boleh kosong.

---

### Requirement 2: Pengelolaan Status Tugas

**User Story:** Sebagai pengguna, saya ingin menandai tugas sebagai selesai atau membatalkan penandaan tersebut, agar saya dapat melacak progres pekerjaan saya.

#### Acceptance Criteria

1. WHEN pengguna mengklik checkbox pada sebuah tugas, THE Task_Manager SHALL mengubah status tugas dari Pending menjadi Completed.
2. WHEN pengguna mengklik checkbox pada tugas yang berstatus Completed, THE Task_Manager SHALL mengubah status tugas kembali menjadi Pending.
3. WHILE sebuah tugas berstatus Completed, THE UI_Renderer SHALL menampilkan tugas tersebut dengan gaya visual yang berbeda (misalnya: teks dicoret atau warna berbeda) untuk membedakannya dari tugas Pending.
4. THE Dashboard_App SHALL menampilkan jumlah total tugas Completed dan Pending sebagai ringkasan di bagian atas dashboard.

---

### Requirement 3: Kategorisasi Tugas

**User Story:** Sebagai pengguna, saya ingin mengelompokkan tugas ke dalam kategori kehidupan yang berbeda, agar saya dapat memisahkan konteks pekerjaan, pribadi, dan lainnya.

#### Acceptance Criteria

1. THE Dashboard_App SHALL menyediakan sekurangnya empat kategori bawaan: Pekerjaan, Pribadi, Kesehatan, dan Belajar.
2. WHEN pengguna membuat atau mengedit tugas, THE Task_Manager SHALL mengharuskan pengguna memilih tepat satu kategori dari daftar yang tersedia.
3. THE UI_Renderer SHALL menampilkan tugas-tugas yang dikelompokkan secara visual berdasarkan kategorinya di dashboard.
4. WHEN pengguna membuat kategori baru dengan nama yang unik, THE Category_Manager SHALL menambahkan kategori tersebut ke daftar kategori yang tersedia.
5. IF pengguna mencoba membuat kategori dengan nama yang sudah ada, THEN THE Category_Manager SHALL menampilkan pesan kesalahan bahwa nama kategori sudah digunakan.

---

### Requirement 4: Prioritas Tugas

**User Story:** Sebagai pengguna, saya ingin menetapkan tingkat prioritas pada setiap tugas, agar saya dapat fokus pada hal-hal yang paling penting terlebih dahulu.

#### Acceptance Criteria

1. THE Task_Manager SHALL mendukung tiga tingkat prioritas: High, Medium, dan Low.
2. WHEN pengguna membuat atau mengedit tugas, THE Task_Manager SHALL mengizinkan pengguna memilih salah satu dari tiga tingkat prioritas tersebut.
3. WHEN tidak ada prioritas yang dipilih saat membuat tugas, THE Task_Manager SHALL menetapkan prioritas Medium sebagai nilai default.
4. THE UI_Renderer SHALL menampilkan indikator visual yang berbeda untuk setiap tingkat prioritas (misalnya: warna label atau ikon) agar mudah dibedakan secara sekilas.

---

### Requirement 5: Filter dan Pencarian Tugas

**User Story:** Sebagai pengguna, saya ingin memfilter dan mencari tugas berdasarkan kriteria tertentu, agar saya dapat dengan cepat menemukan tugas yang relevan.

#### Acceptance Criteria

1. THE Dashboard_App SHALL menyediakan kontrol filter berdasarkan kategori sehingga pengguna dapat menampilkan tugas dari satu atau semua kategori.
2. THE Dashboard_App SHALL menyediakan kontrol filter berdasarkan status (Semua, Pending, Completed).
3. THE Dashboard_App SHALL menyediakan kontrol filter berdasarkan prioritas (Semua, High, Medium, Low).
4. WHEN pengguna mengaplikasikan satu atau lebih filter, THE UI_Renderer SHALL memperbarui daftar tugas yang ditampilkan dalam waktu kurang dari 100ms untuk menampilkan hanya tugas yang sesuai.
5. THE Dashboard_App SHALL menyediakan kotak pencarian teks bebas sehingga pengguna dapat mencari tugas berdasarkan kata kunci dalam judul tugas.
6. WHEN pengguna mengetik di kotak pencarian, THE UI_Renderer SHALL memperbarui daftar tugas yang ditampilkan secara langsung (live search) untuk menampilkan tugas yang judulnya mengandung kata kunci tersebut.

---

### Requirement 6: Persistensi Data

**User Story:** Sebagai pengguna, saya ingin data tugas saya tersimpan secara otomatis, agar saya tidak kehilangan pekerjaan ketika menutup atau menyegarkan browser.

#### Acceptance Criteria

1. WHEN pengguna membuat, memperbarui, atau menghapus sebuah tugas, THE Storage_Handler SHALL menyimpan perubahan tersebut ke Local_Storage secara otomatis tanpa tindakan eksplisit dari pengguna.
2. WHEN Dashboard_App dimuat di browser, THE Storage_Handler SHALL membaca semua data yang tersimpan dari Local_Storage dan memulihkan daftar tugas serta kategori sebelumnya.
3. THE Storage_Handler SHALL menyimpan data dalam format JSON yang valid ke Local_Storage.
4. IF Local_Storage tidak tersedia atau penuh, THEN THE Storage_Handler SHALL menampilkan pesan peringatan kepada pengguna bahwa data tidak dapat disimpan.
5. THE Dashboard_App SHALL berfungsi dengan benar pada browser Chrome, Firefox, Edge, dan Safari versi terbaru menggunakan Local_Storage API standar.

---

### Requirement 7: Ringkasan dan Statistik Dashboard

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan progres saya di dashboard, agar saya dapat mengetahui gambaran umum produktivitas saya secara sekilas.

#### Acceptance Criteria

1. THE UI_Renderer SHALL menampilkan jumlah total tugas, jumlah tugas Completed, dan jumlah tugas Pending di bagian ringkasan dashboard.
2. THE UI_Renderer SHALL menampilkan persentase penyelesaian tugas (jumlah Completed dibagi total tugas dikali 100) yang dibulatkan ke bilangan bulat terdekat.
3. WHEN tidak ada tugas yang tersimpan, THE Dashboard_App SHALL menampilkan pesan panduan yang mengajak pengguna untuk menambahkan tugas pertama mereka.
4. WHEN semua tugas telah berstatus Completed, THE Dashboard_App SHALL menampilkan pesan selamat kepada pengguna.

---

### Requirement 8: Tampilan dan Pengalaman Pengguna

**User Story:** Sebagai pengguna, saya ingin antarmuka yang bersih, responsif, dan mudah digunakan, agar saya dapat berinteraksi dengan dashboard tanpa hambatan.

#### Acceptance Criteria

1. THE Dashboard_App SHALL merender seluruh halaman awal dalam waktu kurang dari 2 detik pada koneksi jaringan standar.
2. THE UI_Renderer SHALL menerapkan perubahan tampilan secara langsung (tanpa reload halaman) setelah setiap operasi pada tugas.
3. THE Dashboard_App SHALL menampilkan tata letak yang dapat digunakan pada ukuran layar desktop (lebar minimal 1024px) maupun layar tablet (lebar minimal 768px).
4. THE Dashboard_App SHALL menggunakan hierarki tipografi yang jelas dengan ukuran font minimum 14px untuk teks isi konten.
5. THE Dashboard_App SHALL memastikan kontras warna antara teks dan latar belakang memenuhi rasio minimum 4.5:1 sesuai panduan WCAG 2.1 AA.
6. WHEN pengguna berinteraksi dengan tombol atau elemen interaktif, THE UI_Renderer SHALL memberikan umpan balik visual (misalnya: perubahan warna atau efek hover) dalam waktu kurang dari 50ms.
```
