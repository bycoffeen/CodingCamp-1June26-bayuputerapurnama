# Implementation Plan: To-Do List Life Dashboard

## Overview

Implementasi single-page application berbasis klien menggunakan HTML, CSS murni, dan Vanilla JavaScript dengan pola MVC ringan. Seluruh kode berada dalam tiga file: `index.html`, `css/style.css`, dan `js/script.js`. Data disimpan di `localStorage` melalui `Storage_Handler`. Pengujian property-based menggunakan fast-check via CDN di file HTML terpisah.

---

## Tasks

- [ ] 1. Bangun struktur HTML shell dan skeleton CSS dasar
  - [ ] 1.1 Buat struktur HTML lengkap di `index.html`
    - Tambahkan elemen `<header>` berisi judul aplikasi
    - Tambahkan section `#summary` untuk ringkasan statistik (total, completed, pending, persentase)
    - Tambahkan section `#filters` untuk kontrol filter kategori, status, prioritas, dan kotak pencarian
    - Tambahkan section `#task-list` sebagai container daftar task card
    - Tambahkan elemen `#task-form` (modal/panel) untuk form tambah/edit tugas dengan field: judul, kategori (select), prioritas (select), tombol simpan & batal, area pesan error
    - Tambahkan elemen `#notification-area` untuk banner peringatan storage
    - Hubungkan `css/style.css` dan `js/script.js`
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ] 1.2 Buat sistem desain dasar di `css/style.css`
    - Definisikan CSS custom properties (variabel warna, font, spacing) yang memenuhi kontras WCAG 2.1 AA (rasio ≥ 4.5:1)
    - Tulis layout responsif menggunakan CSS Grid/Flexbox untuk desktop (≥1024px) dan tablet (≥768px)
    - Atur tipografi dengan ukuran font minimum 14px untuk teks isi
    - Buat style untuk state hover/focus pada tombol dan elemen interaktif (transisi ≤50ms)
    - Buat style awal untuk komponen utama: header, summary, filters, task-card, task-form, notification
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [ ] 2. Implementasikan AppState dan Storage_Handler di `js/script.js`
  - [ ] 2.1 Implementasikan objek `AppState`
    - Definisikan `AppState` sebagai objek singleton dengan properti: `tasks: []`, `categories: []`, `filters: { category: 'all', status: 'all', priority: 'all' }`, `searchQuery: ''`
    - _Requirements: 6.1, 6.2_

  - [ ] 2.2 Implementasikan `Storage_Handler`
    - Implementasikan `Storage_Handler.isAvailable()` yang mengembalikan `true` jika `localStorage` berfungsi
    - Implementasikan `Storage_Handler.load()` yang membaca key `todo_life_dashboard_data` dari `localStorage`, mem-parse JSON, dan mengembalikan `{ tasks, categories }` — gunakan nilai default (array kosong) jika data tidak ada, key tidak ditemukan, atau JSON rusak; log warning ke console jika JSON rusak
    - Implementasikan `Storage_Handler.save(tasks, categories)` yang menyimpan data sebagai JSON valid ke `localStorage`; tangani `QuotaExceededError` dengan memanggil `UI_Renderer.showStorageWarning()`; jika `localStorage` tidak tersedia, tampilkan peringatan dan jalankan app in-memory
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 2.3 Tulis property test untuk Storage_Handler (Property 7)
    - **Property 7: Persistensi data adalah operasi round-trip**
    - Buat file `tests/property-tests.html` yang memuat fast-check via CDN
    - Untuk sembarang state valid (daftar tugas dan kategori dengan semua field valid), `save()` lalu `load()` harus menghasilkan data yang deep-equal dengan state semula, dan data yang tersimpan harus merupakan JSON yang valid
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 3. Implementasikan `Category_Manager`
  - [ ] 3.1 Implementasikan `Category_Manager`
    - Definisikan `DEFAULT_CATEGORIES` dengan empat kategori bawaan: `{ id: 'work', name: 'Pekerjaan' }`, `{ id: 'personal', name: 'Pribadi' }`, `{ id: 'health', name: 'Kesehatan' }`, `{ id: 'study', name: 'Belajar' }`
    - Implementasikan `getCategories()` yang mengembalikan `AppState.categories`
    - Implementasikan `isDuplicateName(name)` yang memeriksa keberadaan nama secara case-insensitive di `AppState.categories`
    - Implementasikan `addCategory(name)` yang menambahkan kategori baru dengan slug id yang dihasilkan dari nama jika nama tidak duplikat; mengembalikan `Category` baru atau `null` jika duplikat atau nama kosong; panggil `Storage_Handler.save()` setelah berhasil
    - _Requirements: 3.1, 3.4, 3.5_

  - [ ]* 3.2 Tulis property test untuk Category_Manager (Property 8)
    - **Property 8: Uniqueness constraint kategori berlaku untuk semua variasi case**
    - Untuk sembarang daftar kategori yang ada, menambahkan kategori dengan nama yang merupakan variasi case dari nama yang sudah ada (e.g., "pekerjaan", "PEKERJAAN", "PeKeRjAaN") harus selalu mengembalikan `null` dan panjang daftar tidak berubah; nama yang benar-benar unik (case-insensitive) harus berhasil ditambahkan
    - **Validates: Requirements 3.4, 3.5**

- [ ] 4. Implementasikan `Task_Manager`
  - [ ] 4.1 Implementasikan `Task_Manager.validateTitle()` dan `createTask()`
    - Implementasikan `validateTitle(title)` yang mengembalikan `{ valid: false, error: '...' }` untuk string kosong atau hanya whitespace, dan `{ valid: true, error: null }` untuk judul valid
    - Implementasikan `createTask(title, categoryId, priority)` yang memanggil `validateTitle()`, membuat objek `Task` baru dengan `id` dari `crypto.randomUUID()` (atau fallback), `status: 'pending'`, `priority` default `'medium'` jika tidak dipilih, `createdAt`/`updatedAt` ISO 8601 timestamp; menambahkannya ke `AppState.tasks`; memanggil `Storage_Handler.save()`; mengembalikan `Task` baru atau `null` jika validasi gagal
    - _Requirements: 1.1, 1.6, 3.2, 4.1, 4.2, 4.3_

  - [ ]* 4.2 Tulis property test untuk Task_Manager — validasi judul dan penambahan tugas (Property 1 & 2)
    - **Property 1: Penambahan tugas valid menambah panjang daftar**
    - Untuk sembarang daftar tugas yang ada dan deskripsi tugas valid (non-empty, non-whitespace-only), menambahkan tugas harus membuat panjang daftar bertambah tepat satu dan tugas baru dapat ditemukan dengan data yang benar
    - **Property 2: Judul kosong atau whitespace selalu ditolak**
    - Untuk sembarang string yang hanya terdiri dari karakter whitespace, `validateTitle()` harus mengembalikan `valid: false` dan daftar tugas tidak boleh berubah
    - **Validates: Requirements 1.1, 1.6**

  - [ ] 4.3 Implementasikan `Task_Manager.updateTask()`, `deleteTask()`, dan `toggleStatus()`
    - Implementasikan `updateTask(id, updates)` yang mencari tugas berdasarkan `id`, menerapkan `updates` (termasuk memperbarui `updatedAt`), memanggil `Storage_Handler.save()`, mengembalikan `true` jika berhasil atau `false` jika tidak ditemukan
    - Implementasikan `deleteTask(id)` yang menghapus tugas dari `AppState.tasks` berdasarkan `id`, memanggil `Storage_Handler.save()`, mengembalikan `true` atau `false`
    - Implementasikan `toggleStatus(id)` yang mengubah status antara `'pending'` dan `'completed'`, memperbarui `updatedAt`, memanggil `Storage_Handler.save()`, mengembalikan `true` atau `false`
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2_

  - [ ]* 4.4 Tulis property test untuk toggleStatus (Property 3)
    - **Property 3: Toggle status adalah operasi round-trip**
    - Untuk sembarang tugas dengan status awal manapun, memanggil `toggleStatus()` dua kali berturut-turut harus mengembalikan tugas ke status semula persis
    - **Validates: Requirements 2.1, 2.2**

- [ ] 5. Checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [ ] 6. Implementasikan `UI_Renderer` — komponen dasar
  - [ ] 6.1 Implementasikan `UI_Renderer.renderSummary()`
    - Render jumlah total tugas, completed, pending, dan persentase penyelesaian (dibulatkan ke integer terdekat) ke dalam section `#summary`
    - Tangani kasus total = 0 (persentase = 0%, bukan NaN)
    - Tampilkan pesan panduan jika tidak ada tugas (Req 7.3) dan pesan selamat jika semua tugas Completed (Req 7.4)
    - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 6.2 Tulis property test untuk renderSummary (Property 5)
    - **Property 5: Ringkasan dashboard selalu akurat dan persentase berada di [0, 100]**
    - Untuk sembarang daftar tugas (termasuk daftar kosong), nilai total, completed, pending, dan persentase yang dirender harus selalu sama dengan nilai yang dihitung langsung dari data, dan persentase harus berada di rentang [0, 100]
    - **Validates: Requirements 7.1, 7.2**

  - [ ] 6.3 Implementasikan `UI_Renderer.renderTaskCard()`
    - Buat elemen DOM card tugas yang menampilkan: checkbox status, judul, label kategori, label prioritas (dengan CSS class berbeda per level: `priority-high`, `priority-medium`, `priority-low`), tombol edit, tombol hapus
    - Untuk tugas Completed: terapkan CSS class `task-completed` (teks dicoret atau warna berbeda)
    - Pastikan setiap card memiliki CSS class yang mencerminkan status dan prioritas tugas
    - _Requirements: 2.3, 4.4_

  - [ ]* 6.4 Tulis property test untuk renderTaskCard (Property 4)
    - **Property 4: Task card mencerminkan data tugas secara visual**
    - Untuk sembarang daftar tugas dengan berbagai kombinasi status dan prioritas, setiap task card yang dirender harus memiliki CSS class yang sesuai dengan status (`pending`/`completed`) dan prioritas (`high`/`medium`/`low`) tugas tersebut
    - **Validates: Requirements 2.3, 4.4**

- [ ] 7. Implementasikan `UI_Renderer` — filter, pencarian, dan render utama
  - [ ] 7.1 Implementasikan `UI_Renderer.applyFilters()`
    - Implementasikan `applyFilters(tasks, filters, searchQuery)` yang menerapkan semua filter (kategori, status, prioritas) dan pencarian kata kunci (case-insensitive pada judul) secara bersamaan
    - Kembalikan array kosong (bukan `null`/`undefined`) jika tidak ada tugas yang cocok
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 7.2 Tulis property test untuk applyFilters (Property 6)
    - **Property 6: Filter dan pencarian hanya mengembalikan tugas yang memenuhi semua kriteria**
    - Untuk sembarang kombinasi filter aktif (kategori, status, prioritas) dan kata kunci pencarian, setiap tugas yang dikembalikan harus memenuhi semua kriteria yang aktif sekaligus — tidak ada tugas yang tidak sesuai yang boleh lolos, dan setiap tugas yang sesuai semua kriteria harus muncul
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

  - [ ] 7.3 Implementasikan `UI_Renderer.renderFilters()` dan `renderTaskList()`
    - Implementasikan `renderFilters(categories, activeFilters)` yang merender dropdown filter kategori (termasuk opsi "Semua"), filter status, filter prioritas, dan kotak pencarian teks bebas ke dalam section `#filters`; tandai filter aktif secara visual
    - Implementasikan `renderTaskList(tasks, filters, searchQuery)` yang memanggil `applyFilters()` lalu merender semua task card yang dihasilkan ke dalam section `#task-list`; selesaikan dalam <100ms untuk dataset tugas normal
    - _Requirements: 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 7.4 Implementasikan `UI_Renderer.renderDashboard()`, `showTaskForm()`, `hideTaskForm()`, `showFormError()`, dan `showStorageWarning()`
    - Implementasikan `renderDashboard()` yang memanggil `renderSummary()`, `renderFilters()`, dan `renderTaskList()` secara berurutan
    - Implementasikan `showTaskForm(task?)` yang menampilkan form dalam mode tambah (kosong) atau mode edit (terisi data tugas yang diberikan, Req 1.3)
    - Implementasikan `hideTaskForm()` yang menyembunyikan form dan membersihkan field
    - Implementasikan `showFormError(message)` yang menampilkan pesan error di dalam form (Req 1.6, 3.5)
    - Implementasikan `showStorageWarning(message)` yang menampilkan banner peringatan di `#notification-area` (Req 6.4)
    - _Requirements: 1.2, 1.3, 1.6, 3.5, 6.4, 8.2_

- [ ] 8. Implementasikan inisialisasi dan event handler
  - [ ] 8.1 Implementasikan fungsi `init()` dan `registerEventListeners()`
    - Implementasikan `init()` yang memanggil `Storage_Handler.load()`, mengisi `AppState.tasks` dan `AppState.categories` (inisialisasi dengan `DEFAULT_CATEGORIES` jika categories kosong), lalu memanggil `UI_Renderer.renderDashboard()`
    - Daftarkan `document.addEventListener('DOMContentLoaded', init)`
    - _Requirements: 3.1, 6.2, 8.1_

  - [ ] 8.2 Implementasikan event delegation untuk operasi tugas
    - Daftarkan event listener pada `#task-list` (event delegation) untuk: klik checkbox → `Task_Manager.toggleStatus()` → re-render; klik tombol edit → `UI_Renderer.showTaskForm(task)`; klik tombol hapus → `Task_Manager.deleteTask()` → re-render
    - Pastikan re-render terjadi tanpa reload halaman (Req 8.2) dan perubahan tampilan langsung terlihat
    - _Requirements: 1.4, 1.5, 2.1, 2.2, 8.2_

  - [ ] 8.3 Implementasikan event handler untuk form tugas
    - Daftarkan event listener pada tombol "Tambah Tugas" untuk memanggil `UI_Renderer.showTaskForm()`
    - Daftarkan event listener pada form submit: ambil nilai judul, kategori, prioritas → jika mode tambah panggil `Task_Manager.createTask()` → jika mode edit panggil `Task_Manager.updateTask()` → tampilkan error via `UI_Renderer.showFormError()` jika gagal → sembunyikan form dan re-render jika berhasil
    - Daftarkan event listener pada tombol batal → `UI_Renderer.hideTaskForm()`
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 4.2, 4.3_

  - [ ] 8.4 Implementasikan event handler untuk filter, pencarian, dan kategori baru
    - Daftarkan event listener pada semua kontrol filter (kategori, status, prioritas): perbarui `AppState.filters` → `UI_Renderer.renderTaskList()`
    - Daftarkan event listener pada kotak pencarian (`input` event): perbarui `AppState.searchQuery` → `UI_Renderer.renderTaskList()` (live search)
    - Daftarkan event listener pada form tambah kategori baru: panggil `Category_Manager.addCategory()` → tampilkan error jika gagal → perbarui dropdown kategori dan re-render filter jika berhasil
    - _Requirements: 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Lengkapi CSS untuk visual indikator dan responsivitas
  - [ ] 9.1 Implementasikan CSS untuk priority labels, task-completed state, dan filter aktif
    - Tambahkan style untuk `.priority-high` (e.g., merah/oranye), `.priority-medium` (e.g., kuning), `.priority-low` (e.g., hijau/abu) sebagai label/badge berwarna berbeda
    - Tambahkan style untuk `.task-completed` (teks dicoret dan/atau warna berbeda)
    - Tambahkan style untuk state filter aktif (highlighted/selected)
    - Pastikan semua transisi hover/focus selesai dalam <50ms
    - _Requirements: 2.3, 4.4, 8.6_

  - [ ] 9.2 Finalisasi layout responsif dan tipografi
    - Verifikasi dan sempurnakan layout di breakpoint desktop (≥1024px) dan tablet (≥768px) menggunakan media queries
    - Pastikan semua teks isi berukuran minimum 14px
    - Verifikasi rasio kontras warna teks/latar ≥ 4.5:1 untuk semua elemen teks utama
    - _Requirements: 8.3, 8.4, 8.5_

- [ ] 10. Tulis unit tests untuk kasus-kasus spesifik
  - [ ]* 10.1 Tulis unit tests untuk kasus-kasus edge di `tests/unit-tests.html`
    - Buat file `tests/unit-tests.html` dengan struktur assertion sederhana (tanpa framework eksternal)
    - Test: tugas baru dibuat dengan prioritas `'medium'` jika tidak dipilih (Req 4.3)
    - Test: empat kategori default tersedia saat pertama kali `AppState.categories` kosong dan `init()` dipanggil (Req 3.1)
    - Test: `Storage_Handler.load()` mengembalikan state default dan log warning jika JSON di storage rusak (Req 6.2, 6.3)
    - Test: `UI_Renderer.renderDashboard()` menampilkan pesan panduan jika `AppState.tasks` kosong (Req 7.3)
    - Test: `UI_Renderer.renderDashboard()` menampilkan pesan selamat jika semua tugas berstatus Completed (Req 7.4)
    - Test: form edit terisi data tugas yang dipilih saat `showTaskForm(task)` dipanggil (Req 1.3)
    - _Requirements: 1.3, 3.1, 4.3, 6.2, 6.3, 7.3, 7.4_

- [ ] 11. Checkpoint akhir — Pastikan semua tests lulus
  - Pastikan semua property tests dan unit tests lulus, tanyakan kepada pengguna jika ada pertanyaan.

---

## Notes

- Task yang ditandai `*` adalah opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task merujuk ke requirement spesifik untuk keterlacakan
- Property tests menggunakan fast-check via CDN di file HTML terpisah (`tests/property-tests.html`)
- Unit tests menggunakan struktur assertion sederhana tanpa framework eksternal (`tests/unit-tests.html`)
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke fase berikutnya
- Property tests memvalidasi properti kebenaran universal; unit tests memvalidasi contoh dan kasus batas spesifik
- Filter dan pencarian diterapkan in-memory di `applyFilters()` tanpa memodifikasi data di storage
- Seluruh re-render dilakukan tanpa reload halaman (full re-render per section DOM)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["2.3", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 6, "tasks": ["6.4", "7.2", "7.3"] },
    { "id": 7, "tasks": ["7.4", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3", "9.1"] },
    { "id": 9, "tasks": ["8.4", "9.2"] },
    { "id": 10, "tasks": ["10.1"] }
  ]
}
```
