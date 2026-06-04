# Design Document

## Fitur: To-Do List Life Dashboard

---

## Overview

To-Do List Life Dashboard adalah single-page application (SPA) berbasis klien yang dibangun dengan HTML, CSS murni, dan Vanilla JavaScript tanpa dependency eksternal. Aplikasi memungkinkan pengguna mengelola tugas harian mereka dalam satu dashboard yang bersih dan intuitif.

Arsitektur keseluruhan mengikuti pola **MVC ringan** (Model-View-Controller) yang diimplementasikan murni dengan Vanilla JS:

- **Model** — struktur data tugas dan kategori yang disimpan di Local Storage
- **View** — fungsi-fungsi render di UI_Renderer yang memanipulasi DOM secara langsung
- **Controller** — event handler dan logika bisnis di Task_Manager, Category_Manager, dan Storage_Handler

Tidak ada build step, bundler, maupun transpiler. Seluruh kode berjalan langsung di browser modern.

**Keputusan desain utama:**
- Seluruh state aplikasi disimpan dalam satu objek JavaScript in-memory (`AppState`) yang disinkronkan ke Local Storage setiap kali ada perubahan data.
- Re-render dilakukan secara full re-render per bagian DOM (bukan virtual DOM), cukup untuk skala data tugas pribadi.
- Filter dan pencarian diterapkan secara in-memory tanpa modifikasi data di storage.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    index.html (entry point)               │
│   - Struktur HTML shell + link ke style.css + script.js  │
└───────────────────────┬──────────────────────────────────┘
                        │ loads
                        ▼
┌──────────────────────────────────────────────────────────┐
│                       script.js                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  AppState (Model)                 │   │
│  │  { tasks: Task[], categories: Category[],        │   │
│  │    filters: FilterState, searchQuery: string }   │   │
│  └────────┬────────────────────────────┬────────────┘   │
│           │ read/write                 │ read            │
│           ▼                            ▼                 │
│  ┌────────────────┐        ┌────────────────────────┐   │
│  │ Storage_Handler│        │      UI_Renderer        │   │
│  │ (LocalStorage  │        │  (DOM Manipulation)     │   │
│  │  read/write)   │        │  renderDashboard()      │   │
│  └────────────────┘        │  renderTaskList()       │   │
│                            │  renderSummary()        │   │
│  ┌────────────────┐        │  renderFilters()        │   │
│  │  Task_Manager  │        └────────────────────────┘   │
│  │  createTask()  │                   ▲                  │
│  │  updateTask()  │                   │ triggers         │
│  │  deleteTask()  │───────────────────┘                  │
│  │  toggleStatus()│                                      │
│  └────────────────┘                                      │
│                                                          │
│  ┌──────────────────┐                                    │
│  │ Category_Manager │                                    │
│  │ addCategory()    │                                    │
│  │ getCategories()  │                                    │
│  └──────────────────┘                                    │
└──────────────────────────────────────────────────────────┘
```

**Alur data utama:**
1. Browser memuat `index.html` → `script.js` dijalankan
2. `Storage_Handler.load()` membaca data dari Local Storage → mengisi `AppState`
3. `UI_Renderer.renderDashboard()` merender tampilan awal
4. Setiap aksi pengguna → event handler → `Task_Manager` / `Category_Manager` memutakhirkan `AppState` → `Storage_Handler.save()` → `UI_Renderer` re-render bagian yang berubah

---

## Components and Interfaces

### 1. AppState (Model)

Objek singleton global yang menyimpan seluruh state aplikasi in-memory.

```javascript
const AppState = {
  tasks: [],        // Task[]
  categories: [],   // Category[]
  filters: {        // FilterState
    category: 'all',   // string: 'all' | category.id
    status: 'all',     // 'all' | 'pending' | 'completed'
    priority: 'all',   // 'all' | 'high' | 'medium' | 'low'
  },
  searchQuery: '',  // string
};
```

---

### 2. Storage_Handler

Bertanggung jawab atas seluruh interaksi dengan `localStorage`.

```javascript
const Storage_Handler = {
  STORAGE_KEY: 'todo_life_dashboard_data',

  // Membaca semua data dari localStorage, mengembalikan { tasks, categories }
  // Mengembalikan nilai default jika data tidak ada atau tidak valid
  load(): { tasks: Task[], categories: Category[] },

  // Menyimpan AppState.tasks dan AppState.categories ke localStorage sebagai JSON
  // Menampilkan pesan peringatan jika localStorage tidak tersedia atau penuh
  save(tasks: Task[], categories: Category[]): void,

  // Mengembalikan true jika localStorage tersedia dan berfungsi
  isAvailable(): boolean,
};
```

---

### 3. Task_Manager

Menangani semua operasi CRUD tugas.

```javascript
const Task_Manager = {
  // Membuat tugas baru dan menambahkannya ke AppState.tasks
  // Mengembalikan Task yang baru dibuat, atau null jika validasi gagal
  createTask(title: string, categoryId: string, priority: Priority): Task | null,

  // Memperbarui tugas yang ada berdasarkan id
  // Mengembalikan true jika berhasil, false jika tugas tidak ditemukan
  updateTask(id: string, updates: Partial<Task>): boolean,

  // Menghapus tugas berdasarkan id
  // Mengembalikan true jika berhasil, false jika tugas tidak ditemukan
  deleteTask(id: string): boolean,

  // Mengubah status tugas antara 'pending' dan 'completed'
  toggleStatus(id: string): boolean,

  // Memvalidasi judul tugas: tidak boleh kosong / hanya whitespace
  // Mengembalikan { valid: boolean, error: string | null }
  validateTitle(title: string): { valid: boolean, error: string | null },
};
```

---

### 4. Category_Manager

Menangani pengelolaan kategori.

```javascript
const Category_Manager = {
  DEFAULT_CATEGORIES: [
    { id: 'work',    name: 'Pekerjaan' },
    { id: 'personal', name: 'Pribadi' },
    { id: 'health',  name: 'Kesehatan' },
    { id: 'study',   name: 'Belajar' },
  ],

  // Menambahkan kategori baru dengan nama unik (case-insensitive)
  // Mengembalikan Category baru, atau null jika nama sudah ada
  addCategory(name: string): Category | null,

  // Mendapatkan semua kategori dari AppState
  getCategories(): Category[],

  // Memeriksa apakah nama kategori sudah ada (case-insensitive)
  isDuplicateName(name: string): boolean,
};
```

---

### 5. UI_Renderer

Bertanggung jawab atas semua manipulasi DOM.

```javascript
const UI_Renderer = {
  // Me-render seluruh dashboard (memanggil semua sub-render di bawah)
  renderDashboard(): void,

  // Me-render bagian ringkasan statistik (total, completed, pending, persentase)
  renderSummary(tasks: Task[]): void,

  // Me-render daftar tugas yang sudah difilter dan dicari
  renderTaskList(tasks: Task[], filters: FilterState, searchQuery: string): void,

  // Me-render kontrol filter dan pencarian
  renderFilters(categories: Category[], activeFilters: FilterState): void,

  // Menerapkan filter dan pencarian ke array tugas, mengembalikan tugas yang sesuai
  applyFilters(tasks: Task[], filters: FilterState, searchQuery: string): Task[],

  // Me-render satu card tugas sebagai elemen DOM
  renderTaskCard(task: Task): HTMLElement,

  // Menampilkan/menyembunyikan form tambah/edit tugas
  showTaskForm(task?: Task): void,
  hideTaskForm(): void,

  // Menampilkan pesan kesalahan di dalam form
  showFormError(message: string): void,

  // Menampilkan pesan peringatan storage di area notifikasi
  showStorageWarning(message: string): void,
};
```

---

### 6. Event Handler (inisialisasi)

Fungsi `init()` yang berjalan saat DOM siap (`DOMContentLoaded`). Mendaftarkan semua event listener ke elemen-elemen DOM menggunakan event delegation di mana memungkinkan.

```javascript
function init() {
  const data = Storage_Handler.load();
  AppState.tasks = data.tasks;
  AppState.categories = data.categories;
  UI_Renderer.renderDashboard();
  registerEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
```

---

## Data Models

### Task

```javascript
/**
 * @typedef {Object} Task
 * @property {string}   id         - UUID unik (crypto.randomUUID() atau fallback)
 * @property {string}   title      - Judul tugas (tidak boleh kosong / hanya whitespace)
 * @property {string}   categoryId - Referensi ke Category.id
 * @property {Priority} priority   - 'high' | 'medium' | 'low'
 * @property {Status}   status     - 'pending' | 'completed'
 * @property {string}   createdAt  - ISO 8601 timestamp
 * @property {string}   updatedAt  - ISO 8601 timestamp
 */
```

### Category

```javascript
/**
 * @typedef {Object} Category
 * @property {string} id   - Slug unik (dihasilkan dari nama, e.g. 'pekerjaan')
 * @property {string} name - Nama kategori yang ditampilkan
 */
```

### Priority

```javascript
/**
 * @typedef {'high' | 'medium' | 'low'} Priority
 */
```

### Status

```javascript
/**
 * @typedef {'pending' | 'completed'} Status
 */
```

### FilterState

```javascript
/**
 * @typedef {Object} FilterState
 * @property {string} category - 'all' atau Category.id
 * @property {string} status   - 'all' | 'pending' | 'completed'
 * @property {string} priority - 'all' | 'high' | 'medium' | 'low'
 */
```

### Storage Schema

Data yang disimpan di `localStorage` menggunakan satu key `todo_life_dashboard_data`:

```json
{
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Belajar Vanilla JS",
      "categoryId": "study",
      "priority": "high",
      "status": "pending",
      "createdAt": "2024-01-15T08:30:00.000Z",
      "updatedAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "categories": [
    { "id": "work",     "name": "Pekerjaan" },
    { "id": "personal", "name": "Pribadi"   },
    { "id": "health",   "name": "Kesehatan" },
    { "id": "study",    "name": "Belajar"   }
  ]
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Penambahan tugas valid menambah panjang daftar

*For any* daftar tugas yang ada dan deskripsi tugas yang valid (non-empty, non-whitespace-only), menambahkan tugas tersebut harus menghasilkan panjang daftar tugas bertambah tepat satu, dan tugas baru harus dapat ditemukan di dalam daftar dengan data yang benar (judul, kategori, prioritas, status Pending).

**Validates: Requirements 1.1**

---

### Property 2: Judul kosong atau whitespace selalu ditolak

*For any* string yang hanya terdiri dari karakter whitespace (spasi, tab, newline, atau kombinasinya), `Task_Manager.validateTitle()` harus menolak string tersebut (mengembalikan `valid: false`), dan daftar tugas tidak boleh berubah.

**Validates: Requirements 1.6**

---

### Property 3: Toggle status adalah operasi round-trip

*For any* tugas dengan status awal manapun (`pending` atau `completed`), memanggil `toggleStatus()` dua kali berturut-turut harus mengembalikan tugas ke status semula persis.

**Validates: Requirements 2.1, 2.2**

---

### Property 4: Task card mencerminkan data tugas secara visual

*For any* daftar tugas dengan berbagai kombinasi status dan prioritas, setiap task card yang dirender oleh `UI_Renderer.renderTaskCard()` harus memiliki indikator visual (CSS class) yang sesuai dengan status (`pending`/`completed`) dan prioritas (`high`/`medium`/`low`) dari tugas tersebut.

*Catatan*: Property ini menggabungkan req 2.3 dan 4.4 karena keduanya menguji prinsip yang sama — visual output harus mencerminkan data task secara akurat.

**Validates: Requirements 2.3, 4.4**

---

### Property 5: Ringkasan dashboard selalu akurat dan persentase berada di [0, 100]

*For any* daftar tugas (termasuk daftar kosong), nilai total, completed, pending, dan persentase yang ditampilkan oleh `renderSummary()` harus selalu sama dengan nilai yang dihitung langsung dari data (`Math.round(completed/total * 100)`), dan persentase harus selalu berada di rentang [0, 100] dengan penanganan pembagian nol yang menghasilkan 0%.

*Catatan*: Property ini menggabungkan req 7.1 dan 7.2 karena keduanya menguji akurasi statistik ringkasan dashboard dari data yang sama.

**Validates: Requirements 7.1, 7.2**

---

### Property 6: Filter dan pencarian hanya mengembalikan tugas yang memenuhi semua kriteria

*For any* kombinasi filter aktif (kategori, status, prioritas) dan kata kunci pencarian, setiap tugas yang dikembalikan oleh `applyFilters()` harus memenuhi semua kriteria yang aktif sekaligus — tidak ada tugas yang tidak sesuai yang boleh lolos, dan setiap tugas yang sesuai semua kriteria harus muncul.

*Catatan*: Property ini menggabungkan req 5.4 dan 5.6 karena keduanya menguji properti yang sama: output `applyFilters()` harus strictly sesuai dengan kriteria yang diberikan, baik filter maupun search query.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

---

### Property 7: Persistensi data adalah operasi round-trip

*For any* state aplikasi yang valid (daftar tugas dan kategori dengan semua field yang valid), memanggil `Storage_Handler.save()` lalu `Storage_Handler.load()` harus menghasilkan data yang ekuivalen secara deep-equal dengan state semula, dan data yang tersimpan di Local Storage harus merupakan JSON yang valid (dapat di-parse tanpa error).

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 8: Uniqueness constraint kategori berlaku untuk semua variasi case

*For any* daftar kategori yang ada, mencoba menambahkan kategori dengan nama yang merupakan variasi case dari nama yang sudah ada (misalnya "pekerjaan", "PEKERJAAN", "PeKeRjAaN") harus selalu menghasilkan `null` dari `addCategory()` dan panjang daftar kategori tidak boleh berubah. Sebaliknya, nama yang benar-benar unik (case-insensitive) harus berhasil ditambahkan dan muncul di daftar.

**Validates: Requirements 3.4, 3.5**

---

## Error Handling

### Validasi Input

| Kondisi | Komponen | Penanganan |
|---|---|---|
| Judul tugas kosong / whitespace | Task_Manager | Tampilkan pesan error di form, batalkan operasi |
| Nama kategori duplikat | Category_Manager | Tampilkan pesan error di form, batalkan operasi |
| Nama kategori kosong | Category_Manager | Tampilkan pesan error di form, batalkan operasi |
| Tidak ada kategori dipilih saat buat tugas | Task_Manager | Default ke kategori pertama atau tampilkan error |

### Local Storage

| Kondisi | Komponen | Penanganan |
|---|---|---|
| `localStorage` tidak tersedia | Storage_Handler | Tampilkan banner peringatan, app tetap berjalan in-memory |
| `localStorage` penuh (QuotaExceededError) | Storage_Handler | Tampilkan pesan peringatan bahwa data tidak tersimpan |
| Data JSON di storage rusak / tidak valid | Storage_Handler | Abaikan data rusak, mulai dengan state default, log warning ke console |

### Defensive Programming

- Semua fungsi yang menerima `id` tugas/kategori harus memeriksa apakah item dengan `id` tersebut ada sebelum beroperasi.
- `applyFilters()` harus mengembalikan array kosong (bukan null/undefined) jika tidak ada tugas yang cocok.
- Persentase penyelesaian harus menangani kasus `totalTugas = 0` (hasilkan 0%, bukan NaN atau Infinity).

---

## Testing Strategy

### Pendekatan Dual Testing

Strategi pengujian menggunakan dua pendekatan komplementer:

1. **Unit tests** — Memverifikasi contoh spesifik, kondisi batas, dan penanganan error.
2. **Property-based tests** — Memverifikasi properti universal yang harus berlaku untuk semua input yang valid.

Keduanya diperlukan: unit test menangkap bug konkret pada kasus tertentu, sedangkan property test memverifikasi kebenaran umum di seluruh ruang input.

### Pilihan Library

Karena proyek ini murni Vanilla JavaScript tanpa bundler/npm, property-based testing menggunakan **[fast-check](https://fast-check.dev/)** yang dapat dimuat via CDN di dalam file HTML test. Unit testing menggunakan struktur assertion sederhana yang tidak memerlukan framework eksternal.

### Property-Based Tests

Setiap property test dikonfigurasi minimum **100 iterasi** dan diberi tag yang merujuk ke properti di design document.

| Test | Tag | Merujuk ke |
|---|---|---|
| Penambahan tugas valid menambah daftar dan tugas dapat ditemukan | `Feature: todo-life-dashboard, Property 1` | Property 1, Req 1.1 |
| Judul whitespace selalu ditolak dan daftar tidak berubah | `Feature: todo-life-dashboard, Property 2` | Property 2, Req 1.6 |
| Toggle status adalah round-trip | `Feature: todo-life-dashboard, Property 3` | Property 3, Req 2.1, 2.2 |
| Task card mencerminkan status dan prioritas secara visual | `Feature: todo-life-dashboard, Property 4` | Property 4, Req 2.3, 4.4 |
| Ringkasan dashboard akurat dan persentase dalam [0,100] | `Feature: todo-life-dashboard, Property 5` | Property 5, Req 7.1, 7.2 |
| Filter dan pencarian hanya mengembalikan tugas yang memenuhi semua kriteria | `Feature: todo-life-dashboard, Property 6` | Property 6, Req 5.1–5.6 |
| Persistensi data round-trip dan JSON valid | `Feature: todo-life-dashboard, Property 7` | Property 7, Req 6.1–6.3 |
| Uniqueness constraint kategori berlaku untuk semua variasi case | `Feature: todo-life-dashboard, Property 8` | Property 8, Req 3.4, 3.5 |

### Unit Tests (Contoh Kasus Spesifik)

- Tugas baru dibuat dengan prioritas Medium jika tidak dipilih (Req 4.3)
- Dashboard menampilkan pesan panduan jika tidak ada tugas (Req 7.3)
- Dashboard menampilkan pesan selamat jika semua tugas Completed (Req 7.4)
- Empat kategori default tersedia saat pertama kali app dimuat (Req 3.1)
- Form edit terisi data tugas yang dipilih (Req 1.3)
- Data JSON yang rusak di storage ditangani dengan graceful (Req 6.2, Req 6.3)

### Integration Tests (Manual / Browser)

- Verifikasi bahwa data tersimpan dan dipulihkan dengan benar setelah browser reload
- Verifikasi tampilan di Chrome, Firefox, Edge, Safari
- Verifikasi layout responsif di ukuran desktop (≥1024px) dan tablet (≥768px)
- Verifikasi tidak ada reload halaman saat melakukan operasi CRUD (Req 8.2)
