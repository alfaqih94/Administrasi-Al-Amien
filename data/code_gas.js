function doGet(e) {
  const action = e.parameter.action;
  const spreadsheetId = "1cW2Bb-h7hI6yVX0E_6QGrAb56dwCfRT6SWCnQ6X-J0o";

  try {
    switch (action) {
      case "presensi":
        return handlePresensi(e, spreadsheetId);
      case "penilaian":
        return handlePenilaian(e, spreadsheetId);
      case "jurnal":
        return handleJurnal(e, spreadsheetId);
      case "getPresensi":
        return getPresensiData(e, spreadsheetId);
      case "getPenilaian":
        return getPenilaianData(e, spreadsheetId);
      case "getJurnal":
        return getJurnalData(e, spreadsheetId);
      default:
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: "Invalid action" })
        ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error("Error in doGet:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handlePresensi(e, spreadsheetId) {
  const kelas = e.parameter.kelas;
  const tanggal = e.parameter.tanggal;
  const dataStr = e.parameter.data;

  if (!kelas || !tanggal || !dataStr) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Missing parameters" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const data = JSON.parse(dataStr);
    const sheet =
      SpreadsheetApp.openById(spreadsheetId).getSheetByName("Presensi");

    // Clear existing data for this date and class
    const existingData = sheet.getDataRange().getValues();
    const rowsToDelete = [];

    for (let i = existingData.length - 1; i >= 1; i--) {
      if (existingData[i][0] === tanggal && existingData[i][1] === kelas) {
        rowsToDelete.push(i + 1);
      }
    }

    // Delete rows in reverse order
    rowsToDelete.forEach((row) => sheet.deleteRow(row));

    // Add new data
    Object.keys(data).forEach((nama) => {
      sheet.appendRow([tanggal, kelas, nama, data[nama]]);
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error in handlePresensi:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handlePenilaian(e, spreadsheetId) {
  const kelas = e.parameter.kelas;
  const tanggal = e.parameter.tanggal;
  const jenis = e.parameter.jenis; // Already includes number like "Tugas-1"
  const dataStr = e.parameter.data;

  if (!kelas || !tanggal || !jenis || !dataStr) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Missing parameters" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const data = JSON.parse(dataStr);
    const sheet =
      SpreadsheetApp.openById(spreadsheetId).getSheetByName("Penilaian");

    // Clear existing data for this date, class, and jenis
    const existingData = sheet.getDataRange().getValues();
    const rowsToDelete = [];

    for (let i = existingData.length - 1; i >= 1; i--) {
      if (
        existingData[i][0] === tanggal &&
        existingData[i][1] === kelas &&
        existingData[i][2] === jenis
      ) {
        rowsToDelete.push(i + 1);
      }
    }

    // Delete rows in reverse order
    rowsToDelete.forEach((row) => sheet.deleteRow(row));

    // Add new data
    Object.keys(data).forEach((nama) => {
      const nilai = data[nama];
      if (nilai && nilai.toString().trim() !== "") {
        sheet.appendRow([tanggal, kelas, jenis, nama, parseFloat(nilai)]);
      }
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error in handlePenilaian:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleJurnal(e, spreadsheetId) {
  const kelas = e.parameter.kelas;
  const tanggal = e.parameter.tanggal;
  const bab = e.parameter.bab;
  const topik = e.parameter.topik;
  const catatan = e.parameter.catatan;

  if (!kelas || !tanggal || !bab || !topik || !catatan) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Missing parameters" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const sheet =
      SpreadsheetApp.openById(spreadsheetId).getSheetByName("Jurnal");

    // Clear existing data for this date and class
    const existingData = sheet.getDataRange().getValues();
    const rowsToDelete = [];

    for (let i = existingData.length - 1; i >= 1; i--) {
      if (existingData[i][0] === tanggal && existingData[i][1] === kelas) {
        rowsToDelete.push(i + 1);
      }
    }

    // Delete rows in reverse order
    rowsToDelete.forEach((row) => sheet.deleteRow(row));

    // Add new data
    sheet.appendRow([tanggal, kelas, bab, topik, catatan]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error in handleJurnal:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getPresensiData(e, spreadsheetId) {
  const kelas = e.parameter.kelas;

  try {
    const sheet =
      SpreadsheetApp.openById(spreadsheetId).getSheetByName("Presensi");
    const data = sheet.getDataRange().getValues();

    // Filter by class and convert to CSV
    let csvContent = "Tanggal,Kelas,Nama,Status\n";

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === kelas) {
        // Check class column
        csvContent += `${row[0]},${row[1]},${row[2]},${row[3]}\n`;
      }
    }

    return ContentService.createTextOutput(csvContent).setMimeType(
      ContentService.MimeType.TEXT
    );
  } catch (error) {
    console.error("Error in getPresensiData:", error);
    return ContentService.createTextOutput("").setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}

function getPenilaianData(e, spreadsheetId) {
  const kelas = e.parameter.kelas;
  const jenis = e.parameter.jenis; // Base type like "Tugas", "UTS", etc.

  try {
    const sheet =
      SpreadsheetApp.openById(spreadsheetId).getSheetByName("Penilaian");
    const data = sheet.getDataRange().getValues();

    // Filter by class and jenis pattern, convert to CSV
    let csvContent = "Tanggal,Kelas,Jenis,Nama,Nilai\n";

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const jenisData = row[2];

      // Check if this row matches our class and jenis pattern
      if (row[1] === kelas && jenisData) {
        // Match pattern like "Tugas-1", "UTS-2", etc.
        const jenisPattern = new RegExp(`^${jenis}-\\d+$`);
        if (jenisPattern.test(jenisData)) {
          csvContent += `${row[0]},${row[1]},${row[2]},${row[3]},${row[4]}\n`;
        }
      }
    }

    return ContentService.createTextOutput(csvContent).setMimeType(
      ContentService.MimeType.TEXT
    );
  } catch (error) {
    console.error("Error in getPenilaianData:", error);
    return ContentService.createTextOutput("").setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}

function getJurnalData(e, spreadsheetId) {
  const kelas = e.parameter.kelas;

  try {
    const sheet =
      SpreadsheetApp.openById(spreadsheetId).getSheetByName("Jurnal");
    const data = sheet.getDataRange().getValues();

    // Filter by class and convert to CSV
    let csvContent = "Tanggal,Kelas,BAB,Topik,Catatan\n";

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === kelas) {
        // Check class column
        csvContent += `${row[0]},${row[1]},${row[2]},${row[3]},${row[4]}\n`;
      }
    }

    return ContentService.createTextOutput(csvContent).setMimeType(
      ContentService.MimeType.TEXT
    );
  } catch (error) {
    console.error("Error in getJurnalData:", error);
    return ContentService.createTextOutput("").setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}
