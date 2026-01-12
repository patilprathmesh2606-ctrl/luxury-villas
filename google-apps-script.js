// Google Apps Script for Luxury Villas Backend

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAMES = {
  VILLAS: 'Villas',
  USERS: 'Users',
  BOOKINGS: 'Bookings'
};

// Initialize sheets
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

// Handle GET requests
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getVillas':
        return getVillas();
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

// Handle POST requests
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  try {
    switch(action) {
      case 'saveVilla':
        return saveVilla(data.data);
      case 'registerUser':
        return registerUser(data.data);
      case 'loginUser':
        return loginUser(data.email, data.password);
      case 'createBooking':
        return createBooking(data.data);
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

// Get all villas
function getVillas() {
  const sheet = getSheet(SHEET_NAMES.VILLAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const villas = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const villa = {};
    
    headers.forEach((header, index) => {
      villa[header.toLowerCase()] = row[index];
    });
    
    // Parse JSON fields
    if (villa.images) villa.images = JSON.parse(villa.images);
    if (villa.features) villa.features = JSON.parse(villa.features);
    if (villa.safety) villa.safety = JSON.parse(villa.safety);
    if (villa.reviews) villa.reviews = JSON.parse(villa.reviews);
    
    villas.push(villa);
  }
  
  return createResponse({ villas });
}

// Save villa
function saveVilla(villaData) {
  const sheet = getSheet(SHEET_NAMES.VILLAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // If no headers, create them
  if (headers.length === 0) {
    sheet.appendRow(['ID', 'Name', 'Location', 'Price', 'Image', 'Images', 'Features', 'Safety', 'Description', 'Reviews']);
  }
  
  // Prepare row data
  const rowData = [
    villaData.id || (data.length),
    villaData.name,
    villaData.location,
    villaData.price,
    villaData.image,
    JSON.stringify(villaData.images || []),
    JSON.stringify(villaData.features || []),
    JSON.stringify(villaData.safety || []),
    villaData.description || '',
    JSON.stringify(villaData.reviews || [])
  ];
  
  if (villaData.id) {
    // Update existing villa
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === villaData.id) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        break;
      }
    }
  } else {
    // Add new villa
    sheet.appendRow(rowData);
  }
  
  return createResponse({ success: true, id: villaData.id || data.length });
}

// Register user
function registerUser(userData) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  
  // Check if user exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === userData.email) {
      throw new Error('User already exists');
    }
  }
  
  // Add new user
  const userId = data.length;
  const rowData = [
    userId,
    userData.firstName,
    userData.lastName,
    userData.email,
    userData.password,
    userData.phone,
    userData.address,
    userData.idProof,
    false, // isAdmin
    JSON.stringify([]) // bookings
  ];
  
  sheet.appendRow(rowData);
  
  return createResponse({
    user: {
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      isAdmin: false
    }
  });
}

// Login user
function loginUser(email, password) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[3] === email && row[4] === password) {
      return createResponse({
        user: {
          id: row[0],
          firstName: row[1],
          lastName: row[2],
          email: row[3],
          phone: row[5],
          isAdmin: row[8]
        }
      });
    }
  }
  
  throw new Error('Invalid email or password');
}

// Create booking
function createBooking(bookingData) {
  const sheet = getSheet(SHEET_NAMES.BOOKINGS);
  const data = sheet.getDataRange().getValues();
  const bookingId = data.length;
  
  const rowData = [
    bookingId,
    bookingData.userId,
    bookingData.villaId,
    bookingData.villaName,
    bookingData.checkIn,
    bookingData.checkOut,
    bookingData.guests,
    bookingData.specialRequests || '',
    bookingData.totalPrice,
    'confirmed',
    new Date().toISOString().split('T')[0]
  ];
  
  sheet.appendRow(rowData);
  
  return createResponse({
    success: true,
    booking: {
      id: bookingId,
      ...bookingData,
      status: 'confirmed'
    }
  });
}

// Create HTTP response
function createResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(statusCode);
}// Google Apps Script for Luxury Villas Backend

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAMES = {
  VILLAS: 'Villas',
  USERS: 'Users',
  BOOKINGS: 'Bookings'
};

// Initialize sheets
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

// Handle GET requests
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getVillas':
        return getVillas();
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

// Handle POST requests
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  try {
    switch(action) {
      case 'saveVilla':
        return saveVilla(data.data);
      case 'registerUser':
        return registerUser(data.data);
      case 'loginUser':
        return loginUser(data.email, data.password);
      case 'createBooking':
        return createBooking(data.data);
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

// Get all villas
function getVillas() {
  const sheet = getSheet(SHEET_NAMES.VILLAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const villas = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const villa = {};
    
    headers.forEach((header, index) => {
      villa[header.toLowerCase()] = row[index];
    });
    
    // Parse JSON fields
    if (villa.images) villa.images = JSON.parse(villa.images);
    if (villa.features) villa.features = JSON.parse(villa.features);
    if (villa.safety) villa.safety = JSON.parse(villa.safety);
    if (villa.reviews) villa.reviews = JSON.parse(villa.reviews);
    
    villas.push(villa);
  }
  
  return createResponse({ villas });
}

// Save villa
function saveVilla(villaData) {
  const sheet = getSheet(SHEET_NAMES.VILLAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // If no headers, create them
  if (headers.length === 0) {
    sheet.appendRow(['ID', 'Name', 'Location', 'Price', 'Image', 'Images', 'Features', 'Safety', 'Description', 'Reviews']);
  }
  
  // Prepare row data
  const rowData = [
    villaData.id || (data.length),
    villaData.name,
    villaData.location,
    villaData.price,
    villaData.image,
    JSON.stringify(villaData.images || []),
    JSON.stringify(villaData.features || []),
    JSON.stringify(villaData.safety || []),
    villaData.description || '',
    JSON.stringify(villaData.reviews || [])
  ];
  
  if (villaData.id) {
    // Update existing villa
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === villaData.id) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        break;
      }
    }
  } else {
    // Add new villa
    sheet.appendRow(rowData);
  }
  
  return createResponse({ success: true, id: villaData.id || data.length });
}

// Register user
function registerUser(userData) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  
  // Check if user exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === userData.email) {
      throw new Error('User already exists');
    }
  }
  
  // Add new user
  const userId = data.length;
  const rowData = [
    userId,
    userData.firstName,
    userData.lastName,
    userData.email,
    userData.password,
    userData.phone,
    userData.address,
    userData.idProof,
    false, // isAdmin
    JSON.stringify([]) // bookings
  ];
  
  sheet.appendRow(rowData);
  
  return createResponse({
    user: {
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      isAdmin: false
    }
  });
}

// Login user
function loginUser(email, password) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[3] === email && row[4] === password) {
      return createResponse({
        user: {
          id: row[0],
          firstName: row[1],
          lastName: row[2],
          email: row[3],
          phone: row[5],
          isAdmin: row[8]
        }
      });
    }
  }
  
  throw new Error('Invalid email or password');
}

// Create booking
function createBooking(bookingData) {
  const sheet = getSheet(SHEET_NAMES.BOOKINGS);
  const data = sheet.getDataRange().getValues();
  const bookingId = data.length;
  
  const rowData = [
    bookingId,
    bookingData.userId,
    bookingData.villaId,
    bookingData.villaName,
    bookingData.checkIn,
    bookingData.checkOut,
    bookingData.guests,
    bookingData.specialRequests || '',
    bookingData.totalPrice,
    'confirmed',
    new Date().toISOString().split('T')[0]
  ];
  
  sheet.appendRow(rowData);
  
  return createResponse({
    success: true,
    booking: {
      id: bookingId,
      ...bookingData,
      status: 'confirmed'
    }
  });
}

// Create HTTP response
function createResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(statusCode);
}