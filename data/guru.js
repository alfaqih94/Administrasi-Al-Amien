// Database Guru
const dataGuru = {
  faqih: {
    nama: "Abd. Faqih, S.Pd.",
    mapel: "IPA",
    kelas: ["VII-B", "VII-C"],
    password: "123",
    jadwal: {
      6: [
        // Sabtu
        { waktu: "07:40 - 09:00", kelas: "VII-C" },
        { waktu: "11:00 - 12:20", kelas: "VII-B" },
      ],
      0: [
        // Minggu
        { waktu: "07:40 - 09:00", kelas: "VII-B" },
        { waktu: "11:00 - 12:20", kelas: "VII-C" },
      ],
    },
  },
};

// Guru yang sedang login
let currentGuru = null;

// Fungsi untuk login guru
function loginGuru(password) {
  for (const guruId in dataGuru) {
    if (dataGuru[guruId].password === password) {
      currentGuru = dataGuru[guruId];
      return true;
    }
  }
  return false;
}

// Fungsi untuk mendapatkan data guru yang sedang login
function getCurrentGuru() {
  return currentGuru;
}

// Fungsi untuk mendapatkan kelas yang diajar guru
function getKelasGuru() {
  return currentGuru ? currentGuru.kelas : [];
}

// Fungsi untuk mendapatkan jadwal guru
function getJadwalGuru() {
  return currentGuru ? currentGuru.jadwal : {};
}

// Fungsi untuk logout guru
function logoutGuru() {
  currentGuru = null;
}

// Fungsi untuk mengisi dropdown kelas berdasarkan guru yang login
function populateKelasDropdowns() {
  if (!currentGuru) return;

  const kelasOptions = currentGuru.kelas
    .map((kelas) => `<option value="${kelas}">${kelas}</option>`)
    .join("");

  // Update semua dropdown kelas
  const dropdowns = [
    "presensiKelas",
    "penilaianKelas",
    "jurnalKelas",
    "rekapKelas",
  ];
  dropdowns.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML =
        '<option value="">Pilih Kelas</option>' + kelasOptions;
    }
  });
}

// Fungsi untuk update informasi guru di header dan dashboard
function updateGuruInfo() {
  if (!currentGuru) return;

  // Update header
  const guruNama = document.getElementById("guruNama");
  const guruMapel = document.getElementById("guruMapel");
  if (guruNama) guruNama.textContent = currentGuru.nama;
  if (guruMapel) guruMapel.textContent = `Guru ${currentGuru.mapel}`;

  // Update dashboard
  const dashboardNama = document.getElementById("dashboardNama");
  const dashboardMapel = document.getElementById("dashboardMapel");
  if (dashboardNama) dashboardNama.textContent = currentGuru.nama;
  if (dashboardMapel) dashboardMapel.textContent = currentGuru.mapel;
}
