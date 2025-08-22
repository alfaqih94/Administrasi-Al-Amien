// Google Apps Script Configuration
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxxc9QcOk09ZBcOKIIWmTcLL6FYXrwNUPCfmQSUmTAbTRlCMnWQC7ptaJNLgE06fid5sA/exec";
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQyr7uNi5EUtr4IB8Lsq48gCivvpzDDevPe9vWEM2eRivFL30_ks5vjSACy-NMStljq--N8-0vMTQpV/pub?output=csv";
const SHEET_ID = "1cW2Bb-h7hI6yVX0E_6QGrAb56dwCfRT6SWCnQ6X-J0o";

// Data storage
let presensiData = {};
let penilaianData = {};
let jurnalData = {};

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Set today's date for all date inputs
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("presensiTanggal").value = today;
  document.getElementById("penilaianTanggal").value = today;
  document.getElementById("jurnalTanggal").value = today;
});

// Authentication Functions
function login() {
  const password = document.getElementById("passwordInput").value;

  if (loginGuru(password)) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("mainApp").classList.remove("hidden");

    // Update UI dengan data guru
    updateGuruInfo();
    populateKelasDropdowns();
    updateTodaySchedule();
  } else {
    alert("Password salah!");
  }
}

function logout() {
  logoutGuru();
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("passwordInput").value = "";
}

// Navigation Functions
function showScreen(screenName) {
  // Hide all screens
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.add("hidden");
  });

  // Show selected screen
  document.getElementById(screenName + "Screen").classList.remove("hidden");

  // Update navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("border-blue-600", "text-blue-600");
    btn.classList.add("border-transparent", "text-gray-600");
  });
  event.target.classList.remove("border-transparent", "text-gray-600");
  event.target.classList.add("border-blue-600", "text-blue-600");
}

// Time and Schedule Functions
function updateDateTime() {
  const now = new Date();
  const timeString =
    now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " WIB";
  const dateString = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  document.getElementById("currentTime").textContent = timeString;
  document.getElementById("currentDate").textContent = dateString;
}

function updateTodaySchedule() {
  const today = new Date().getDay();
  const scheduleDiv = document.getElementById("todaySchedule");
  const jadwalGuru = getJadwalGuru();

  let allSchedules = "";

  // Show schedules for all days
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  Object.keys(jadwalGuru).forEach((dayNum) => {
    const dayIndex = parseInt(dayNum);
    const dayName = dayNames[dayIndex];
    const isToday = today === dayIndex;

    allSchedules += `<h3 class="font-semibold text-gray-800 mb-2 ${
      isToday ? "text-blue-600" : ""
    }">${dayName}:</h3>`;

    jadwalGuru[dayNum].forEach((jadwal) => {
      allSchedules += `
                <div class="flex justify-between items-center p-3 rounded-lg mb-2 ${
                  isToday
                    ? "bg-blue-100 border-2 border-blue-500"
                    : "bg-gray-50"
                }">
                    <span class="font-medium ${
                      isToday ? "text-blue-800" : "text-gray-700"
                    }">${jadwal.kelas}</span>
                    <span class="${
                      isToday ? "text-blue-600" : "text-gray-600"
                    }">${jadwal.waktu}</span>
                </div>
            `;
    });
  });

  scheduleDiv.innerHTML = allSchedules;
}

// Presensi Functions
function tampilkanPresensi() {
  const kelas = document.getElementById("presensiKelas").value;
  const tanggal = document.getElementById("presensiTanggal").value;

  if (!kelas || !tanggal) {
    alert("Pilih kelas dan tanggal terlebih dahulu!");
    return;
  }

  const daftarDiv = document.getElementById("daftarSiswa");
  daftarDiv.innerHTML = "";
  daftarDiv.classList.remove("hidden");
  document.getElementById("kirimPresensi").classList.remove("hidden");

  const siswaList = getSiswaByKelas(kelas);
  const key = `${kelas}-${tanggal}`;
  if (!presensiData[key]) presensiData[key] = {};

  siswaList.forEach((nama, index) => {
    const status = presensiData[key][nama] || "Masuk";
    daftarDiv.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-medium text-gray-800">${nama}</span>
                    <span class="text-sm text-gray-500">${index + 1}</span>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    <button onclick="updatePresensi('${nama}', '${kelas}', '${tanggal}', 'Masuk')" 
                        class="presensi-btn px-3 py-2 rounded-lg text-sm font-medium ${
                          status === "Masuk"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }">
                        Masuk
                    </button>
                    <button onclick="updatePresensi('${nama}', '${kelas}', '${tanggal}', 'Izin')" 
                        class="presensi-btn px-3 py-2 rounded-lg text-sm font-medium ${
                          status === "Izin"
                            ? "bg-yellow-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }">
                        Izin
                    </button>
                    <button onclick="updatePresensi('${nama}', '${kelas}', '${tanggal}', 'Sakit')" 
                        class="presensi-btn px-3 py-2 rounded-lg text-sm font-medium ${
                          status === "Sakit"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }">
                        Sakit
                    </button>
                    <button onclick="updatePresensi('${nama}', '${kelas}', '${tanggal}', 'Alpha')" 
                        class="presensi-btn px-3 py-2 rounded-lg text-sm font-medium ${
                          status === "Alpha"
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }">
                        Alpha
                    </button>
                </div>
            </div>
        `;
  });
}

function updatePresensi(nama, kelas, tanggal, status) {
  const key = `${kelas}-${tanggal}`;
  if (!presensiData[key]) presensiData[key] = {};
  presensiData[key][nama] = status;
  tampilkanPresensi(); // Refresh display
}

// Penilaian Functions
function tampilkanPenilaian() {
  const kelas = document.getElementById("penilaianKelas").value;
  const tanggal = document.getElementById("penilaianTanggal").value;
  const jenis = document.getElementById("jenisPenilaian").value;
  const urutanTugas =
    parseInt(document.getElementById("urutanTugas").value) || 1;

  if (!kelas || !tanggal) {
    alert("Pilih kelas dan tanggal terlebih dahulu!");
    return;
  }

  const daftarDiv = document.getElementById("daftarNilai");
  daftarDiv.innerHTML = "";
  daftarDiv.classList.remove("hidden");
  document.getElementById("kirimPenilaian").classList.remove("hidden");

  const siswaList = getSiswaByKelas(kelas);
  const key = `${kelas}-${tanggal}-${jenis}-${urutanTugas}`;
  if (!penilaianData[key]) penilaianData[key] = {};

  // Add header showing assessment with proper numbering
  let displayTitle;
  if (jenis === "Tugas") {
    displayTitle = `${jenis}-${urutanTugas}`;
  } else if (jenis === "UTS") {
    displayTitle = `${jenis}-${urutanTugas}`;
  } else if (jenis === "UAS") {
    displayTitle = `${jenis}-${urutanTugas}`;
  } else if (jenis === "Catatan") {
    displayTitle = `${jenis}-${urutanTugas}`;
  }

  daftarDiv.innerHTML += `
        <div class="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
            <h3 class="text-lg font-semibold text-blue-800 text-center">
                ${displayTitle} - ${kelas}
            </h3>
            <p class="text-sm text-blue-600 text-center mt-1">Tanggal: ${new Date(
              tanggal
            ).toLocaleDateString("id-ID")}</p>
        </div>
    `;

  siswaList.forEach((nama, index) => {
    const nilai = penilaianData[key][nama] || "";
    daftarDiv.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-medium text-gray-800">${nama}</span>
                    <span class="text-sm text-gray-500">${index + 1}</span>
                </div>
                <input type="number" 
                    value="${nilai}" 
                    onchange="updateNilai('${nama}', '${kelas}', '${tanggal}', '${jenis}', '${urutanTugas}', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="Masukkan nilai (0-100)" 
                    min="0" max="100">
            </div>
        `;
  });
}

function updateNilai(nama, kelas, tanggal, jenis, urutanTugas, nilai) {
  const key = `${kelas}-${tanggal}-${jenis}-${urutanTugas}`;
  if (!penilaianData[key]) penilaianData[key] = {};
  penilaianData[key][nama] = nilai;
}

function toggleUrutanTugas() {
  const jenis = document.getElementById("jenisPenilaian").value;
  const urutanDiv = document.getElementById("urutanTugasDiv");
  const urutanLabel = urutanDiv.querySelector("label");

  // Always show the field but change the label
  urutanDiv.style.display = "block";

  if (jenis === "Tugas") {
    urutanLabel.textContent = "Urutan Tugas Ke-";
    document.getElementById("urutanTugas").placeholder = "1";
  } else if (jenis === "UTS") {
    urutanLabel.textContent = "Urutan UTS Ke-";
    document.getElementById("urutanTugas").placeholder = "1";
  } else if (jenis === "UAS") {
    urutanLabel.textContent = "Urutan UAS Ke-";
    document.getElementById("urutanTugas").placeholder = "1";
  } else if (jenis === "Catatan") {
    urutanLabel.textContent = "Urutan Catatan Ke-";
    document.getElementById("urutanTugas").placeholder = "1";
  }
}

// Jurnal Functions
function tampilkanJurnal() {
  const kelas = document.getElementById("jurnalKelas").value;
  const tanggal = document.getElementById("jurnalTanggal").value;

  if (!kelas || !tanggal) {
    alert("Pilih kelas dan tanggal terlebih dahulu!");
    return;
  }

  document.getElementById("formJurnal").classList.remove("hidden");
  document.getElementById("lihatJurnalBtn").classList.remove("hidden");
}

function tampilkanDaftarJurnal() {
  const kelas = document.getElementById("jurnalKelas").value;

  if (!kelas) {
    alert("Pilih kelas terlebih dahulu!");
    return;
  }

  const daftarDiv = document.getElementById("daftarJurnal");
  daftarDiv.classList.remove("hidden");
  loadJurnalFromServer(kelas, daftarDiv);
}

// Rekap Functions
function updateSiswaFilter() {
  const kelas = document.getElementById("rekapKelas").value;
  const filterSiswa = document.getElementById("filterSiswa");

  // Clear existing options
  filterSiswa.innerHTML = '<option value="">Semua Siswa</option>';

  if (kelas) {
    const siswaList = getSiswaByKelas(kelas);
    siswaList.forEach((nama) => {
      filterSiswa.innerHTML += `<option value="${nama}">${nama}</option>`;
    });
  }
}

function tampilkanRekap() {
  const kelas = document.getElementById("rekapKelas").value;
  const jenis = document.getElementById("jenisRekap").value;
  const siswa = document.getElementById("filterSiswa").value;

  if (!kelas) {
    alert("Pilih kelas terlebih dahulu!");
    return;
  }

  const hasilDiv = document.getElementById("hasilRekap");
  hasilDiv.classList.remove("hidden");

  if (jenis === "presensi") {
    loadRekapFromServer(kelas, "presensi", hasilDiv, siswa);
  } else {
    // For assessment types, use the jenis directly (Tugas, UTS, UAS, Catatan)
    loadRekapFromServer(kelas, jenis, hasilDiv, siswa);
  }
}

// Modal Functions
function showLoadingModal(
  title = "Mengirim Data ke Server",
  message = "Mohon tunggu..."
) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = message;
  document.getElementById("loadingModal").classList.remove("hidden");
}

function hideLoadingModal() {
  document.getElementById("loadingModal").classList.add("hidden");
}

function showSuccessModal() {
  document.getElementById("modalTitle").textContent = "Data Terkirim";
  document.getElementById("modalMessage").textContent =
    "Data berhasil dikirim ke server";
  document.querySelector("#loadingModal .animate-spin").classList.add("hidden");

  setTimeout(() => {
    hideLoadingModal();
    document
      .querySelector("#loadingModal .animate-spin")
      .classList.remove("hidden");
  }, 2000);
}

function showErrorModal(message) {
  document.getElementById("modalTitle").textContent = "Error";
  document.getElementById("modalMessage").textContent = message;
  document.querySelector("#loadingModal .animate-spin").classList.add("hidden");

  setTimeout(() => {
    hideLoadingModal();
    document
      .querySelector("#loadingModal .animate-spin")
      .classList.remove("hidden");
  }, 3000);
}

// Server Communication Functions
async function makeRequest(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempting request ${i + 1}:`, url);

      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("Response received:", text.substring(0, 200) + "...");

      // Try to parse as JSON, if fails return as text
      try {
        const jsonResult = JSON.parse(text);
        console.log("Parsed as JSON:", jsonResult);
        return jsonResult;
      } catch {
        console.log("Returned as text");
        return text;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

async function kirimDataPresensi() {
  const kelas = document.getElementById("presensiKelas").value;
  const tanggal = document.getElementById("presensiTanggal").value;
  const key = `${kelas}-${tanggal}`;

  // Prepare complete data including default "Masuk" for unclicked students
  const siswaList = getSiswaByKelas(kelas);
  const completeData = {};

  siswaList.forEach((nama) => {
    // Use clicked status or default to "Masuk"
    completeData[nama] =
      presensiData[key] && presensiData[key][nama]
        ? presensiData[key][nama]
        : "Masuk";
  });

  showLoadingModal("Mengirim Data Presensi", "Menyimpan ke server...");

  try {
    // Build URL with parameters - split long URLs if needed
    const dataStr = JSON.stringify(completeData);
    console.log("Sending presensi data:", dataStr);

    const url = `${APPS_SCRIPT_URL}?action=presensi&kelas=${encodeURIComponent(
      kelas
    )}&tanggal=${encodeURIComponent(tanggal)}&data=${encodeURIComponent(
      dataStr
    )}`;

    // Check URL length
    if (url.length > 2000) {
      throw new Error("Data terlalu besar untuk dikirim sekaligus");
    }

    const result = await makeRequest(url);

    if (result && result.success) {
      showSuccessModal();
      console.log("Presensi data sent successfully");
    } else {
      console.error("Failed to send presensi:", result);
      showErrorModal(result?.message || "Gagal mengirim data presensi");
    }
  } catch (error) {
    console.error("Error sending presensi:", error);
    showErrorModal(`Koneksi gagal: ${error.message}`);
  }
}

async function kirimDataPenilaian() {
  const kelas = document.getElementById("penilaianKelas").value;
  const tanggal = document.getElementById("penilaianTanggal").value;
  const jenis = document.getElementById("jenisPenilaian").value;
  const urutanTugas =
    parseInt(document.getElementById("urutanTugas").value) || 1;

  const key = `${kelas}-${tanggal}-${jenis}-${urutanTugas}`;

  if (!penilaianData[key] || Object.keys(penilaianData[key]).length === 0) {
    alert("Tidak ada data penilaian untuk dikirim!");
    return;
  }

  // Filter out empty values
  const filteredData = {};
  Object.keys(penilaianData[key]).forEach((nama) => {
    const nilai = penilaianData[key][nama];
    if (nilai && nilai.toString().trim() !== "") {
      filteredData[nama] = nilai;
    }
  });

  if (Object.keys(filteredData).length === 0) {
    alert("Tidak ada nilai yang valid untuk dikirim!");
    return;
  }

  showLoadingModal("Mengirim Data Penilaian", "Menyimpan ke server...");

  try {
    const dataStr = JSON.stringify(filteredData);
    console.log("Sending penilaian data:", dataStr);

    // Create proper jenis with order number for all types
    const jenisWithOrder = `${jenis}-${urutanTugas}`;

    let url = `${APPS_SCRIPT_URL}?action=penilaian&kelas=${encodeURIComponent(
      kelas
    )}&tanggal=${encodeURIComponent(tanggal)}&jenis=${encodeURIComponent(
      jenisWithOrder
    )}&data=${encodeURIComponent(dataStr)}`;

    // Check URL length
    if (url.length > 2000) {
      throw new Error("Data terlalu besar untuk dikirim sekaligus");
    }

    const result = await makeRequest(url);

    if (result && result.success) {
      showSuccessModal();
      console.log("Penilaian data sent successfully");
    } else {
      console.error("Failed to send penilaian:", result);
      showErrorModal(result?.message || "Gagal mengirim data penilaian");
    }
  } catch (error) {
    console.error("Error sending penilaian:", error);
    showErrorModal(`Koneksi gagal: ${error.message}`);
  }
}

async function simpanJurnal() {
  const kelas = document.getElementById("jurnalKelas").value;
  const tanggal = document.getElementById("jurnalTanggal").value;
  const bab = document.getElementById("jurnalBab").value.trim();
  const topik = document.getElementById("jurnalTopik").value.trim();
  const catatan = document.getElementById("jurnalCatatan").value.trim();

  if (!kelas || !tanggal) {
    alert("Pilih kelas dan tanggal terlebih dahulu!");
    return;
  }

  if (!bab || !topik || !catatan) {
    alert("Lengkapi semua field jurnal!");
    return;
  }

  showLoadingModal("Menyimpan Jurnal", "Mengirim ke server...");

  try {
    console.log("Saving journal:", { kelas, tanggal, bab, topik, catatan });

    const url = `${APPS_SCRIPT_URL}?action=jurnal&kelas=${encodeURIComponent(
      kelas
    )}&tanggal=${encodeURIComponent(tanggal)}&bab=${encodeURIComponent(
      bab
    )}&topik=${encodeURIComponent(topik)}&catatan=${encodeURIComponent(
      catatan
    )}`;

    // Check URL length
    if (url.length > 2000) {
      throw new Error("Data jurnal terlalu panjang");
    }

    const result = await makeRequest(url);

    if (result && result.success) {
      // Clear form
      document.getElementById("jurnalBab").value = "";
      document.getElementById("jurnalTopik").value = "";
      document.getElementById("jurnalCatatan").value = "";

      console.log("Journal saved successfully");
      showSuccessModal();
    } else {
      console.error("Failed to save journal:", result);
      showErrorModal(result?.message || "Gagal menyimpan jurnal");
    }
  } catch (error) {
    console.error("Error saving journal:", error);
    showErrorModal(`Koneksi gagal: ${error.message}`);
  }
}

// Data Loading Functions
async function loadJurnalFromServer(kelas, container) {
  showLoadingModal(
    "Memuat Daftar Jurnal",
    `Mengambil jurnal untuk ${kelas}...`
  );

  try {
    const url = `${APPS_SCRIPT_URL}?action=getJurnal&kelas=${encodeURIComponent(
      kelas
    )}`;
    console.log("Loading journal from:", url);
    const csvData = await makeRequest(url);
    console.log("Journal data received:", csvData);

    hideLoadingModal();

    if (typeof csvData === "string" && csvData.trim()) {
      displayJurnalFromCSV(csvData, kelas, container);
    } else {
      container.innerHTML = `
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Daftar Jurnal - ${kelas}</h3>
                    <p class="text-gray-500 text-center py-8">Belum ada jurnal untuk kelas ini</p>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading journal:", error);
    hideLoadingModal();
    container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Daftar Jurnal - ${kelas}</h3>
                <p class="text-red-500 text-center py-8">Error memuat jurnal: ${error.message}</p>
            </div>
        `;
  }
}

async function loadRekapFromServer(kelas, jenis, container, filterSiswa = "") {
  const loadingText = filterSiswa
    ? `Mengambil data ${jenis} untuk ${filterSiswa}...`
    : `Mengambil data ${jenis} untuk ${kelas}...`;
  showLoadingModal("Memuat Data Rekap", loadingText);

  try {
    let url = `${APPS_SCRIPT_URL}?action=`;

    if (jenis === "presensi") {
      url += `getPresensi&kelas=${encodeURIComponent(kelas)}`;
    } else {
      url += `getPenilaian&kelas=${encodeURIComponent(
        kelas
      )}&jenis=${encodeURIComponent(jenis)}`;
    }

    console.log("Loading recap from:", url);
    const csvData = await makeRequest(url);
    console.log("Recap data received:", csvData);

    hideLoadingModal();

    if (typeof csvData === "string" && csvData.trim()) {
      if (jenis === "presensi") {
        displayRekapPresensiFromCSV(csvData, kelas, container, filterSiswa);
      } else {
        displayRekapPenilaianFromCSV(
          csvData,
          kelas,
          jenis,
          container,
          filterSiswa
        );
      }
    } else {
      const title = filterSiswa
        ? `${jenis} - ${filterSiswa}`
        : `${jenis} - ${kelas}`;
      container.innerHTML = `
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Rekap ${title}</h3>
                    <p class="text-gray-500 text-center py-8">Belum ada data ${jenis} untuk ${
        filterSiswa || "kelas ini"
      }</p>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading recap:", error);
    hideLoadingModal();
    const title = filterSiswa
      ? `${jenis} - ${filterSiswa}`
      : `${jenis} - ${kelas}`;
    container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Rekap ${title}</h3>
                <p class="text-red-500 text-center py-8">Error memuat data rekap: ${error.message}</p>
            </div>
        `;
  }
}

// Display Functions
function displayRekapPresensiFromCSV(
  csvData,
  kelas,
  container,
  filterSiswa = ""
) {
  const lines = csvData.trim().split("\n");
  const siswaList = filterSiswa ? [filterSiswa] : getSiswaByKelas(kelas);

  if (filterSiswa) {
    // Detailed view for individual student
    const studentData = [];
    if (lines.length > 1) {
      lines.slice(1).forEach((line) => {
        const [tanggal, kelasData, nama, status] = line.split(",");
        if (nama === filterSiswa) {
          studentData.push({ tanggal, status });
        }
      });
    }

    // Sort by date (newest first)
    studentData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    const summary = { Masuk: 0, Izin: 0, Sakit: 0, Alpha: 0 };
    studentData.forEach((data) => summary[data.status]++);

    container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Detail Presensi - ${filterSiswa}</h3>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-4 gap-3 mb-6">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-green-600">${
                          summary.Masuk
                        }</div>
                        <div class="text-sm text-green-700">Masuk</div>
                    </div>
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-yellow-600">${
                          summary.Izin
                        }</div>
                        <div class="text-sm text-yellow-700">Izin</div>
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-blue-600">${
                          summary.Sakit
                        }</div>
                        <div class="text-sm text-blue-700">Sakit</div>
                    </div>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-red-600">${
                          summary.Alpha
                        }</div>
                        <div class="text-sm text-red-700">Alpha</div>
                    </div>
                </div>
                
                <!-- Detailed History -->
                <h4 class="font-semibold text-gray-800 mb-3">Riwayat Presensi:</h4>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    ${
                      studentData.length > 0
                        ? studentData
                            .map((data) => {
                              const formattedDate = new Date(
                                data.tanggal
                              ).toLocaleDateString("id-ID");
                              const statusColor = {
                                Masuk: "bg-green-100 text-green-800",
                                Izin: "bg-yellow-100 text-yellow-800",
                                Sakit: "bg-blue-100 text-blue-800",
                                Alpha: "bg-red-100 text-red-800",
                              };
                              return `
                            <div class="flex justify-between items-center p-2 border border-gray-200 rounded">
                                <span class="text-sm text-gray-600">${formattedDate}</span>
                                <span class="px-2 py-1 rounded text-xs font-medium ${
                                  statusColor[data.status]
                                }">${data.status}</span>
                            </div>
                        `;
                            })
                            .join("")
                        : '<p class="text-gray-500 text-center py-4">Belum ada data presensi</p>'
                    }
                </div>
            </div>
        `;
  } else {
    // Summary view for all students
    const summary = {};
    siswaList.forEach((nama) => {
      summary[nama] = { Masuk: 0, Izin: 0, Sakit: 0, Alpha: 0 };
    });

    // Process CSV data (skip header)
    if (lines.length > 1) {
      lines.slice(1).forEach((line) => {
        const [tanggal, kelasData, nama, status] = line.split(",");
        if (summary[nama]) {
          summary[nama][status]++;
        }
      });
    }

    container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Rekap Presensi - ${kelas}</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2">Nama Siswa</th>
                                <th class="text-center py-2">Masuk</th>
                                <th class="text-center py-2">Izin</th>
                                <th class="text-center py-2">Sakit</th>
                                <th class="text-center py-2">Alpha</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${siswaList
                              .map(
                                (nama) => `
                                <tr class="border-b">
                                    <td class="py-2">${nama}</td>
                                    <td class="text-center py-2 text-green-600">${summary[nama].Masuk}</td>
                                    <td class="text-center py-2 text-yellow-600">${summary[nama].Izin}</td>
                                    <td class="text-center py-2 text-blue-600">${summary[nama].Sakit}</td>
                                    <td class="text-center py-2 text-red-600">${summary[nama].Alpha}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
  }
}

function displayRekapPenilaianFromCSV(
  csvData,
  kelas,
  jenis,
  container,
  filterSiswa = ""
) {
  const lines = csvData.trim().split("\n");
  const siswaList = filterSiswa ? [filterSiswa] : getSiswaByKelas(kelas);

  console.log("Processing CSV data for jenis:", jenis);
  console.log("CSV lines:", lines.length);

  if (filterSiswa) {
    // Detailed view for individual student - show only matching jenis with numbers
    const studentScores = [];
    if (lines.length > 1) {
      lines.slice(1).forEach((line) => {
        if (line.trim()) {
          const parts = line.split(",");
          console.log("Processing line parts:", parts);

          if (parts.length >= 5) {
            const [tanggal, kelasData, jenisData, nama, nilai] = parts;
            console.log(
              `Checking: nama=${nama}, jenisData=${jenisData}, jenis=${jenis}`
            );

            // Match exact jenis pattern (e.g., "Tugas-1", "UTS-2", etc.)
            const jenisPattern = new RegExp(`^${jenis}-\\d+$`);
            if (
              nama === filterSiswa &&
              jenisData &&
              jenisPattern.test(jenisData) &&
              nilai &&
              !isNaN(nilai)
            ) {
              console.log("Adding score:", {
                tanggal,
                jenis: jenisData,
                nilai: parseFloat(nilai),
              });
              studentScores.push({
                tanggal,
                jenis: jenisData,
                nilai: parseFloat(nilai),
              });
            }
          }
        }
      });
    }

    console.log("Student scores found:", studentScores);

    // Sort by jenis number (Tugas-1, Tugas-2, etc.)
    studentScores.sort((a, b) => {
      const aNum = parseInt(a.jenis.split("-")[1]) || 0;
      const bNum = parseInt(b.jenis.split("-")[1]) || 0;
      return aNum - bNum;
    });

    const count = studentScores.length;
    const avg =
      count > 0
        ? (studentScores.reduce((a, b) => a + b.nilai, 0) / count).toFixed(1)
        : 0;
    const max = count > 0 ? Math.max(...studentScores.map((s) => s.nilai)) : 0;
    const min = count > 0 ? Math.min(...studentScores.map((s) => s.nilai)) : 0;

    container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Detail Penilaian ${jenis} - ${filterSiswa}</h3>
                
                <!-- Summary Cards -->
                <div class="grid grid-cols-4 gap-3 mb-6">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-blue-600">${count}</div>
                        <div class="text-sm text-blue-700">Total ${jenis}</div>
                    </div>
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-purple-600">${avg}</div>
                        <div class="text-sm text-purple-700">Rata-rata</div>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-green-600">${max}</div>
                        <div class="text-sm text-green-700">Tertinggi</div>
                    </div>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-red-600">${min}</div>
                        <div class="text-sm text-red-700">Terendah</div>
                    </div>
                </div>
                
                <!-- Detailed History -->
                <h4 class="font-semibold text-gray-800 mb-3">Riwayat ${jenis}:</h4>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    ${
                      studentScores.length > 0
                        ? studentScores
                            .map((score) => {
                              const formattedDate = new Date(
                                score.tanggal
                              ).toLocaleDateString("id-ID");
                              const scoreColor =
                                score.nilai >= 80
                                  ? "text-green-600"
                                  : score.nilai >= 70
                                  ? "text-blue-600"
                                  : score.nilai >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600";
                              return `
                            <div class="flex justify-between items-center p-3 border border-gray-200 rounded">
                                <div>
                                    <div class="text-sm font-medium text-gray-800">${score.jenis}</div>
                                    <div class="text-xs text-gray-500">${formattedDate}</div>
                                </div>
                                <div class="text-lg font-bold ${scoreColor}">${score.nilai}</div>
                            </div>
                        `;
                            })
                            .join("")
                        : `<p class="text-gray-500 text-center py-4">Belum ada data ${jenis}</p>`
                    }
                </div>
            </div>
        `;
  } else {
    // Summary view for all students - group by numbered assessments
    const assessmentTypes = new Set();
    const scores = {};

    siswaList.forEach((nama) => {
      scores[nama] = {};
    });

    // Process CSV data and collect assessment types
    if (lines.length > 1) {
      lines.slice(1).forEach((line) => {
        if (line.trim()) {
          const parts = line.split(",");
          console.log("Processing summary line parts:", parts);

          if (parts.length >= 5) {
            const [tanggal, kelasData, jenisData, nama, nilai] = parts;

            // Match exact jenis pattern (e.g., "Tugas-1", "UTS-2", etc.)
            const jenisPattern = new RegExp(`^${jenis}-\\d+$`);
            if (
              jenisData &&
              jenisPattern.test(jenisData) &&
              scores[nama] &&
              nilai &&
              !isNaN(nilai)
            ) {
              console.log(
                `Adding to summary: ${nama} -> ${jenisData} = ${nilai}`
              );
              assessmentTypes.add(jenisData);
              if (!scores[nama][jenisData]) scores[nama][jenisData] = [];
              scores[nama][jenisData].push(parseFloat(nilai));
            }
          }
        }
      });
    }

    console.log("Assessment types found:", Array.from(assessmentTypes));
    console.log("Scores summary:", scores);

    // Sort assessment types by number
    const sortedAssessments = Array.from(assessmentTypes).sort((a, b) => {
      const aNum = parseInt(a.split("-")[1]) || 0;
      const bNum = parseInt(b.split("-")[1]) || 0;
      return aNum - bNum;
    });

    console.log("Sorted assessments:", sortedAssessments);

    container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Rekap Penilaian ${jenis} - ${kelas}</h3>
                ${
                  sortedAssessments.length > 0
                    ? `
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2 px-2">Nama Siswa</th>
                                ${sortedAssessments
                                  .map(
                                    (assessment) =>
                                      `<th class="text-center py-2 px-1 min-w-16">${assessment}</th>`
                                  )
                                  .join("")}
                                <th class="text-center py-2 px-2">Rata-rata</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${siswaList
                              .map((nama) => {
                                const allScores = [];
                                const rowData = sortedAssessments
                                  .map((assessment) => {
                                    const assessmentScores =
                                      scores[nama][assessment] || [];
                                    if (assessmentScores.length > 0) {
                                      const avg = (
                                        assessmentScores.reduce(
                                          (a, b) => a + b,
                                          0
                                        ) / assessmentScores.length
                                      ).toFixed(0);
                                      allScores.push(parseFloat(avg));
                                      return `<td class="text-center py-2 px-1 font-medium">${avg}</td>`;
                                    }
                                    return `<td class="text-center py-2 px-1 text-gray-400">-</td>`;
                                  })
                                  .join("");

                                const overallAvg =
                                  allScores.length > 0
                                    ? (
                                        allScores.reduce((a, b) => a + b, 0) /
                                        allScores.length
                                      ).toFixed(1)
                                    : "-";

                                return `
                                    <tr class="border-b">
                                        <td class="py-2 px-2">${nama}</td>
                                        ${rowData}
                                        <td class="text-center py-2 px-2 font-bold text-blue-600">${overallAvg}</td>
                                    </tr>
                                `;
                              })
                              .join("")}
                        </tbody>
                    </table>
                </div>
                `
                    : `<p class="text-gray-500 text-center py-8">Belum ada data ${jenis} untuk kelas ini</p>`
                }
            </div>
        `;
  }
}

function displayJurnalFromCSV(csvData, kelas, container) {
  const lines = csvData.trim().split("\n");

  container.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Daftar Jurnal - ${kelas}</h3>
            <div class="space-y-4">
    `;

  if (lines.length > 1) {
    const journals = [];
    lines.slice(1).forEach((line) => {
      if (line.trim()) {
        const parts = line.split(",");
        if (parts.length >= 5) {
          const tanggal = parts[0];
          const kelasData = parts[1];
          const bab = parts[2];
          const topik = parts[3];
          const catatan = parts.slice(4).join(",");
          journals.push({ tanggal, bab, topik, catatan });
        }
      }
    });

    if (journals.length > 0) {
      // Sort by date (newest first)
      journals.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

      // Add summary card
      container.innerHTML += `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">${journals.length}</div>
                        <div class="text-sm text-blue-700">Total Jurnal Mengajar</div>
                    </div>
                </div>
            `;

      journals.forEach((jurnal) => {
        const formattedDate = new Date(jurnal.tanggal).toLocaleDateString(
          "id-ID"
        );
        container.innerHTML += `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-medium text-gray-800">${jurnal.bab}</span>
                            <span class="text-sm text-gray-500">${formattedDate}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2"><strong>Topik:</strong> ${jurnal.topik}</p>
                        <p class="text-sm text-gray-600"><strong>Catatan:</strong> ${jurnal.catatan}</p>
                    </div>
                `;
      });
    } else {
      container.innerHTML +=
        '<p class="text-gray-500 text-center py-8">Belum ada jurnal untuk kelas ini</p>';
    }
  } else {
    container.innerHTML +=
      '<p class="text-gray-500 text-center py-8">Belum ada jurnal untuk kelas ini</p>';
  }

  container.innerHTML += `
            </div>
        </div>
    `;
}
