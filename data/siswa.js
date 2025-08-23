// Database Siswa per Kelas
const dataSiswa = {
  "VII-B": [
    "Abdur Rahman",
    "Ach. Salman Al Farisy S",
    "Ahmad Afief Firdaus A",
    "Ahmad Naufal Tijani",
    "Ahmad Shaba Nusay R",
    "Alfian Ahmad Nur Ilmi",
    "Fahad Abdullah Arifin",
    "Fauzan Sadid Qaulah",
    "Fayzul Kemad",
    "Hafidz Ahmad Rabbani",
    "Hafilullah Chairul Affan",
    "Hafidz Ali Yusuf",
    "Khalid Abdillah",
    "M.B Sultan Ayyasy",
    "M. Izzat Akhdan AK",
    "M. Aldo Alfharis",
    "M. Arif Firdaus",
    "M. Farham Waalidy",
    "M. Ilzan Faqih Ayatullah",
    "M. Syabil Khola alfal A",
    "Rafka Aditya",
    "Syarif Hidayatullah",
    "Ziyan Kafi Aznan",
  ],
  "VII-C": [
    "Abdul Haris Firdaus",
    "Ahmad Bilal Ramdani",
    "Ahmad Kamilil Khair",
    "Ahmad Nurullah",
    "Ahmad Zahran",
    "Arman Nurahman",
    "Denis Kiyan Dre Arrohman",
    "Gibran Iddlan Hakim",
    "Gilang Rasya Satriardin",
    "Khodil Jalanidhi Wafi",
    "M. Deni Ardana Baskara",
    "Moh. Azzam Kanta R",
    "Moh. Kanza Aufa Dzikri",
    "Moh. Raihan Al Farisi",
    "Moh. Shohibus Sulton",
    "M. Nabhan Mubarok",
    "M. Nafis Ulinnuha Zain",
    "M. Yasin",
    "M. Khafid Abdullah",
    "Noval Ribut Bahtiar",
    "Rizki Ikhwan Ramadhan",
    "Zaky Arasy",
  ],
};

// Fungsi untuk mendapatkan daftar siswa berdasarkan kelas
function getSiswaByKelas(kelas) {
  return dataSiswa[kelas] || [];
}

// Fungsi untuk mendapatkan semua kelas yang tersedia
function getAllKelas() {
  return Object.keys(dataSiswa);
}

// Fungsi untuk mendapatkan jumlah siswa per kelas
function getJumlahSiswa(kelas) {
  return dataSiswa[kelas] ? dataSiswa[kelas].length : 0;
}
