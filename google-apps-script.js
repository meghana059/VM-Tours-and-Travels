// Google Apps Script - Code.gs
// Deploy this as a Web App in Google Apps Script (Execute as: Me, Access: Anyone)

const CONFIG = {
  FORM_ID: '1vcTXsZ0wTVGMdVEwOHyKTSgfh0Ey-VK65rtYK7mlDPg',
  SHEET_ID: '1LGlbwpaPIqcJvS8SOoP64S39Iic1bBcDv2Xdv76P_k8',
  SHEET_TAB: 'Form Responses 1',
  OWNER_EMAIL: 'engmeghana@gmail.com',
  GOOGLE_DISTANCE_API_KEY: 'AIzaSyCvh94LjftZWU-eVM380sTSRqtfXkKyw-g',
  API_URL: 'https://script.google.com/macros/s/AKfycbylv6F4TMYGo-NlLXZt8ox6ivrTJKHpeaBiIAolqiuEEFRQeoQ0VzDdboRrYD8Spf61Cw/exec',
  SUBMIT_TO_FORM: false
};

// Fixed package prices (no distance calculation)
const PACKAGE_FIXED_PRICES = {
  'Sedan': 1995,
  'Maruti Ertiga AC': 2495,
  'Toyota Innova AC': 2695,
  'Toyota Innova Crysta AC': 2895,
  'Tempo Traveller Non-AC': 3995,
  'Tempo Traveller AC': 4495
};

// Vehicle pricing for local trips (distance-based rates)
// PERMANENT LOCAL RATES - DO NOT CHANGE WITHOUT APPROVAL
const VEHICLE_PRICING = {
  // Local trip pricing (distance-based rates) - FIXED RATES
  'Sedan': 20,                    // 4+1 seater - ₹20/km
  'Maruti Ertiga AC': 28,         // 6+1 seater - ₹28/km
  'Toyota Innova AC': 32,         // 7+1 seater - ₹32/km
  'Toyota Innova Crysta AC': 38,  // 7+1 seater - ₹38/km
  'Tempo Traveller Non-AC': 58,   // 12+1 seater - ₹58/km
  'Tempo Traveller AC': 62,       // 12+1 seater - ₹62/km
  'Bus 21+1 AC': 31,              // 21+1 seater - ₹31/km
  'Bus 21+1 Non-AC': 28,          // 21+1 seater - ₹28/km
  // Outstation trip pricing (per km rates)
  'Outstation': {
    'Sedan': 11,                    // 4+1 seater
    'Maruti Ertiga AC': 14,         // 6+1 seater
    'Toyota Innova AC': 16,         // 7+1 seater
    'Toyota Innova Crysta AC': 17,  // 7+1 seater
    'Tempo Traveller Non-AC': 17,   // 12+1 seater
    'Tempo Traveller AC': 19,       // 12+1 seater
    'Bus 21+1 AC': 31,              // 21+1 seater
    'Bus 21+1 Non-AC': 28,          // 21+1 seater
  },
  // Legacy pricing for other vehicle types (if needed)
  'Toyota Etios AC': 20,
  'Swift Dzire AC': 16,
  'Tempo Traveller': 40,
  'Bus (30+ Seater)': 60
};

function doGet(e) {
  try {
    console.log('doGet called with parameters:', e);
    console.log('e.parameter:', e.parameter);
    console.log('e.parameter.action:', e.parameter?.action);
    
    // Handle distance calculation requests
    if (e && e.parameter && e.parameter.action === 'distance') {
      const origin = e.parameter.origin;
      const destination = e.parameter.destination;
      
      if (!origin || !destination) {
        return ContentService.createTextOutput(JSON.stringify({ 
          error: 'Missing origin or destination' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const distanceResult = calculateDistance(origin, destination);
      
      if (distanceResult.success) {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          distance: distanceResult.distance
        }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: distanceResult.error
        }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    if (e && e.parameter && e.parameter.test === '1') {
      // Test Google API distance calculation
      const distanceResult = calculateDistance('Basavanagudi', 'Indiranagar');
      console.log('Google API distance result:', distanceResult);
      
      // Test fallback distance calculation
      const fallbackDistance = getFallbackDistance('Basavanagudi', 'Indiranagar');
      console.log('Fallback distance result:', fallbackDistance);
      
      // Use the better distance
      const finalDistance = distanceResult.success ? distanceResult.distance : fallbackDistance;
      console.log('Final distance used:', finalDistance);
      
      // Test fare calculation
      const fareDetails = calculateFare(finalDistance, 'Sedan', 1, 'Local');
      console.log('Test fare calculation:', fareDetails);
      
      // Test sheet append
      appendDirectlyToSheet({
        name: 'TEST',
        phone: '0000000000',
        email: 'test@example.com',
        message: 'debug test',
        bookingType: 'Local',
        tripType: 'One Way',
        vehicle: 'Sedan',
        pickup: 'Basavanagudi',
        drop: 'Indiranagar',
        travelDate: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        time: '10:00',
        packageType: '',
        startDate: '',
        returnDate: '',
        distance: fareDetails.distance,
        pricePerKm: fareDetails.pricePerKm,
        numberOfDays: fareDetails.numberOfDays,
        baseFare: fareDetails.baseFare,
        dailyCharge: fareDetails.dailyCharge,
        totalFare: fareDetails.totalFare
      });
      
      return ContentService.createTextOutput(JSON.stringify({ 
        ok: true, 
        message: 'Test completed',
        distance: distanceResult,
        fare: fareDetails
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'VM API running. Use POST.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight requests
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(body);

    // Normalize values
    const booking = normalizeBooking(data);

  // Calculate distance and fare
  try {
      // Short-circuit for Package bookings: use fixed prices and skip distance
      if ((booking.bookingType || '').toLowerCase() === 'package') {
        var fixed = PACKAGE_FIXED_PRICES[String(booking.vehicle || '')] || '';
        booking.distance = '';
        booking.pricePerKm = '';
        booking.numberOfDays = 1;
        booking.baseFare = fixed || '';
        booking.dailyCharge = 0;
        booking.totalFare = fixed || '';
        booking.tripFare = fixed || '';
        console.log('Package booking – using fixed price:', booking.vehicle, fixed);
      } else {
      const distanceResult = calculateDistance(booking.pickup, booking.drop);
      let finalDistance = 10; // Default fallback
      
      if (distanceResult.success) {
        finalDistance = distanceResult.distance;
        console.log('Using Google API distance:', finalDistance, 'km');
      } else {
        console.warn('Google API distance calculation failed:', distanceResult.error);
        console.log('Using fallback distance calculation...');
        finalDistance = getFallbackDistance(booking.pickup, booking.drop);
        console.log('Fallback distance calculated:', finalDistance, 'km');
      }
      
      console.log('=== FARE CALCULATION DEBUG ===');
      console.log('Booking vehicle:', booking.vehicle);
      console.log('Booking type:', booking.bookingType);
      console.log('Calculated distance:', finalDistance);
      
      const numberOfDays = calculateNumberOfDays(booking.startDate, booking.returnDate);
      console.log('Number of days:', numberOfDays);
      
      const fareDetails = calculateFare(finalDistance, booking.vehicle, numberOfDays, booking.bookingType);
      console.log('Fare calculation result:', fareDetails);
      
      // Add fare details to booking
      booking.distance = fareDetails.distance;
      booking.pricePerKm = fareDetails.pricePerKm;
      booking.numberOfDays = fareDetails.numberOfDays;
      booking.baseFare = fareDetails.baseFare;
      booking.dailyCharge = fareDetails.dailyCharge;
      booking.totalFare = fareDetails.totalFare;
      
      // Also add tripFare for compatibility
      booking.tripFare = fareDetails.totalFare;
      
      console.log('Fare added to booking - totalFare:', booking.totalFare, 'tripFare:', booking.tripFare);
      }
    } catch (fareErr) {
      console.warn('Fare calculation failed:', fareErr);
      // Continue without fare details
    }

    // 1) (Optional) Submit to Google Form. Disabled by default to prevent duplicate rows.
    if (CONFIG.SUBMIT_TO_FORM) {
      try {
        submitToGoogleForm(booking);
      } catch (formErr) {
        console.warn('Form submit failed, will still append to Sheet:', formErr);
      }
    }

    // 2) Ensure target Sheet exists and enforce headers/columns
    ensureSheetExists(CONFIG.SHEET_ID, CONFIG.SHEET_TAB);
    enforceSheetHeadersAndColumns(CONFIG.SHEET_ID, CONFIG.SHEET_TAB);

    // Force Local return date blank to avoid phantom default dates in date-formatted cells
    if (booking.bookingType === 'Local') {
      booking.returnDate = '';
    }
    appendDirectlyToSheet(booking);

    // 3) Send email notifications
    sendOwnerEmail(booking);
    if (booking.email) sendCustomerEmail(booking);

    return ContentService.createTextOutput(JSON.stringify({ 
      ok: true, 
      message: 'Saved',
      fareCalculated: !!booking.totalFare,
      totalFare: booking.totalFare || null,
      distance: booking.distance || null,
      pricePerKm: booking.pricePerKm || null,
      numberOfDays: booking.numberOfDays || null,
      baseFare: booking.baseFare || null,
      dailyCharge: booking.dailyCharge || null
    }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function normalizeBooking(d) {
  console.log('=== NORMALIZE BOOKING DEBUG ===');
  console.log('Input data:', d);
  
  // Normalize booking type to handle case variations
  const bookingType = (d.bookingType || 'Local').toLowerCase() === 'local' ? 'Local' : 
                     (d.bookingType || 'Local').toLowerCase() === 'outstation' ? 'Outstation' :
                     (d.bookingType || 'Local').toLowerCase() === 'package' ? 'Package' : 'Local';
  
  console.log('Normalized booking type:', bookingType);
  
  // Conditional fields based on booking type
  let tripType = '';
  let packageType = '';
  
  if (bookingType === 'Local') {
    // For local trips: don't save trip type and package type
    tripType = '';
    packageType = '';
    console.log('Local booking: tripType and packageType set to empty');
  } else if (bookingType === 'Package') {
    // For package trips: trip type not required, keep only package type
    tripType = '';
    packageType = d.packageType || '';
  } else if (bookingType === 'Outstation') {
    // For outstation trips: no package type
    tripType = d.tripType || '';
    packageType = 'N/A';
  } else {
    // Default case
    tripType = d.tripType || '';
    packageType = d.packageType || '';
  }
  
  // NEW LOGIC: travelDate is now the start date for all bookings
  // returnDate is only used for outstation round trips
  const rawTravelDate = d.travelDate || d.packageDate || d.onewayDate || d.startDate || d.date || '';
  const returnDate = (bookingType === 'Outstation' && tripType === 'Round Trip') ? (d.returnDate || '') : '';
  
  // Date handling logs will be printed after formatting below
  
  // Normalize/construct time (server-side safety)
  var timeNormalized = d.time || d.travelTime || d.packageTime || d.onewayTime || d.roundtripTime || '';
  if (!timeNormalized && d.hour && d.minute && d.period) {
    var h = String(d.hour).padStart(2, '0');
    var m = String(d.minute).padStart(2, '0');
    var p = String(d.period).toUpperCase();
    // Convert to 24h HH:MM for consistency
    var hh = parseInt(h, 10);
    if (p === 'PM' && hh !== 12) hh += 12;
    if (p === 'AM' && hh === 12) hh = 0;
    timeNormalized = String(hh).padStart(2, '0') + ':' + m;
  }
  // Build time from package-specific selectors if still empty
  if (!timeNormalized && d.packageHour && d.packageMinute && d.packagePeriod) {
    var ph = String(d.packageHour).padStart(2, '0');
    var pm = String(d.packageMinute).padStart(2, '0');
    var pp = String(d.packagePeriod).toUpperCase();
    var phh = parseInt(ph, 10);
    if (pp === 'PM' && phh !== 12) phh += 12;
    if (pp === 'AM' && phh === 12) phh = 0;
    timeNormalized = String(phh).padStart(2, '0') + ':' + pm;
  }
  // Build time from oneway/roundtrip selectors if still empty
  if (!timeNormalized && d.onewayHour && d.onewayMinute && d.onewayPeriod) {
    var oh = String(d.onewayHour).padStart(2, '0');
    var om = String(d.onewayMinute).padStart(2, '0');
    var op = String(d.onewayPeriod).toUpperCase();
    var ohh = parseInt(oh, 10);
    if (op === 'PM' && ohh !== 12) ohh += 12;
    if (op === 'AM' && ohh === 12) ohh = 0;
    timeNormalized = String(ohh).padStart(2, '0') + ':' + om;
  }
  if (!timeNormalized && d.roundtripHour && d.roundtripMinute && d.roundtripPeriod) {
    var rh = String(d.roundtripHour).padStart(2, '0');
    var rm = String(d.roundtripMinute).padStart(2, '0');
    var rp = String(d.roundtripPeriod).toUpperCase();
    var rhh = parseInt(rh, 10);
    if (rp === 'PM' && rhh !== 12) rhh += 12;
    if (rp === 'AM' && rhh === 12) rhh = 0;
    timeNormalized = String(rhh).padStart(2, '0') + ':' + rm;
  }

  // Final formatting to persist in Sheet
  var tz = Session.getScriptTimeZone();
  var travelDate = '';
  try {
    travelDate = rawTravelDate ? Utilities.formatDate(new Date(rawTravelDate), tz, 'yyyy-MM-dd') : '';
  } catch (e) {
    travelDate = String(rawTravelDate || '');
  }
  var timeFormatted = '';
  try {
    if (timeNormalized) {
      var timeDate = parseTimeToDate(timeNormalized);
      timeFormatted = Utilities.formatDate(timeDate, tz, 'HH:mm');
    }
  } catch (e2) {
    timeFormatted = String(timeNormalized || '');
  }

  const startDate = travelDate; // travelDate becomes startDate for all bookings

  console.log('Date handling:');
  console.log('- travelDate:', travelDate);
  console.log('- startDate:', startDate);
  console.log('- returnDate:', returnDate);
  console.log('- bookingType:', bookingType);
  console.log('- tripType:', tripType);
  console.log('- Should return date be empty?', bookingType !== 'Outstation' || tripType !== 'Round Trip');

  return {
    id: d.id || ('BK' + Date.now()),
    timestamp: d.timestamp || new Date().toISOString(),
    name: d.name || '',
    phone: d.phone || '',
    email: d.email || '',
    message: d.message || '',
    bookingType: bookingType,
    tripType: tripType,
    vehicle: d.vehicle || d.selectedVehicle || '',
    pickup: d.pickup || d.pickupLocation || d.packagePickup || '',
    drop: d.drop || d.dropLocation || '',
    travelDate: travelDate,
    time: timeFormatted || d.pickupTime || d.travel_time || d.package_time || '',
    packageType: packageType,
    startDate: startDate, // Now always equals travelDate
    returnDate: returnDate // Only for outstation round trips
  };
}

function submitToGoogleForm(b) {
  console.log('=== FORM SUBMISSION DEBUG START ===');
  console.log('Booking data:', b);
  
  const form = FormApp.openById(CONFIG.FORM_ID);
  const items = form.getItems();
  console.log('Form items found:', items.length);
  
  // Log all form item titles for debugging
  items.forEach(function(item, index) {
    console.log('Item ' + index + ':', item.getTitle(), 'Type:', item.getType());
  });
  
  const r = form.createResponse();

  // Helpers for tolerant title matching
  function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function findByTitles(titleOptions, type){
    const wanted = titleOptions.map(norm);
    const found = items.find(function(i){
      var t = norm(i.getTitle());
      var okType = (!type || i.getType() === type);
      return okType && wanted.some(function(w){ return t === w || t.indexOf(w) !== -1; });
    });
    if (found) {
      console.log('Found item for', titleOptions, ':', found.getTitle());
    } else {
      console.log('No item found for', titleOptions, 'type:', type);
    }
    return found;
  }

  var mappedCount = 0;

  // Name
  var it = findByTitles(['Name'], FormApp.ItemType.TEXT);
  if (it) { r.withItemResponse(it.asTextItem().createResponse(b.name)); mappedCount++; }
  // Phone Number
  it = findByTitles(['Phone Number','Phone'], FormApp.ItemType.TEXT);
  if (it) { r.withItemResponse(it.asTextItem().createResponse(b.phone)); mappedCount++; }
  // Email (note: if Form collects email automatically, this field may not exist)
  it = findByTitles(['Email'], FormApp.ItemType.TEXT);
  if (it) { r.withItemResponse(it.asTextItem().createResponse(b.email)); mappedCount++; }
  // Message (always include, even if empty)
  it = findByTitles(['Message / Special Requirement','Message','Special Requirement'], FormApp.ItemType.PARAGRAPH_TEXT);
  if (it) { 
    const messageValue = b.message || ''; // Ensure message is always a string
    r.withItemResponse(it.asParagraphTextItem().createResponse(messageValue)); 
    mappedCount++; 
  }
  // Booking Type
  it = findByTitles(['Booking Type']);
  if (it) { mapChoice(r, it, b.bookingType); mappedCount++; }
  // Trip Type - only for non-local bookings
  if (b.bookingType !== 'Local') {
    it = findByTitles(['Trip Type']);
    if (it) { mapChoice(r, it, b.tripType); mappedCount++; }
  }
  // Vehicle
  it = findByTitles(['Vehicle','Vehicle Preference']);
  if (it) { mapChoice(r, it, b.vehicle); mappedCount++; }
  // Pickup/Drop
  it = findByTitles(['Pickup Location','Pickup'], FormApp.ItemType.TEXT);
  if (it) { r.withItemResponse(it.asTextItem().createResponse(b.pickup)); mappedCount++; }
  it = findByTitles(['Drop Location','Drop'], FormApp.ItemType.TEXT);
  if (it) { r.withItemResponse(it.asTextItem().createResponse(b.drop)); mappedCount++; }
  // Dates
  it = findByTitles(['Travel Date','Date'], FormApp.ItemType.DATE);
  if (it && b.travelDate) { r.withItemResponse(it.asDateItem().createResponse(new Date(b.travelDate))); mappedCount++; }
  // Start Date field removed - travelDate is now used as startDate for all bookings
  it = findByTitles(['Return Date'], FormApp.ItemType.DATE);
  if (it && b.returnDate) { r.withItemResponse(it.asDateItem().createResponse(new Date(b.returnDate))); mappedCount++; }
  // Time - Always try to map time field if it exists
  it = findByTitles(['Travel Time','Time'], FormApp.ItemType.TIME);
  if (it && b.time) { 
    try {
      r.withItemResponse(it.asTimeItem().createResponse(parseTimeToDate(b.time))); 
      mappedCount++; 
    } catch (timeError) {
      console.log('Time mapping failed, trying as text:', timeError);
      // Fallback: try to map as text if time item fails
      it = findByTitles(['Travel Time','Time'], FormApp.ItemType.TEXT);
      if (it) {
        r.withItemResponse(it.asTextItem().createResponse(b.time));
        mappedCount++;
      }
    }
  }
  // Package Type - only for package bookings
  if (b.bookingType === 'Package') {
    it = findByTitles(['Package Type','Package']);
    if (it) { mapChoice(r, it, b.packageType); mappedCount++; }
  }

  console.log('Total fields mapped:', mappedCount);
  console.log('Submitting response...');
  
  try {
    r.submit();
    console.log('Form response submitted successfully');
  } catch (submitError) {
    console.log('Form submission failed:', submitError.toString());
    throw submitError;
  }
  
  console.log('=== FORM SUBMISSION DEBUG END ===');
}

function mapChoice(r, formItem, value) {
  var type = formItem.getType();
  if (type === FormApp.ItemType.LIST) {
    r.withItemResponse(formItem.asListItem().createResponse(value || ''));
  } else if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
    r.withItemResponse(formItem.asMultipleChoiceItem().createResponse(value || ''));
  } else if (type === FormApp.ItemType.CHECKBOX) {
    r.withItemResponse(formItem.asCheckboxItem().createResponse(value ? [value] : []));
  } else if (type === FormApp.ItemType.TEXT) {
    r.withItemResponse(formItem.asTextItem().createResponse(value || ''));
  }
}

function parseTimeToDate(hhmm) {
  // Accept 'HH:MM', 'H:MM AM/PM', 'HH:MM:SS', etc.
  var timeStr = String(hhmm || '').trim();
  console.log('Parsing time:', timeStr);
  
  // Try different time formats
  var m = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
  if (!m) {
    console.log('Time format not recognized, using default');
    return new Date('1970-01-01T00:00:00Z');
  }
  
  var h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  var ap = (m[4] || '').toUpperCase();
  
  // Handle AM/PM
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  
  // Validate time
  if (h < 0 || h > 23 || min < 0 || min > 59) {
    console.log('Invalid time values, using default');
    return new Date('1970-01-01T00:00:00Z');
  }
  
  var iso = Utilities.formatString('%s:%s', ('0'+h).slice(-2), ('0'+min).slice(-2));
  var result = new Date('1970-01-01T' + iso + ':00');
  console.log('Parsed time result:', result);
  return result;
}

function ensureSheetExists(sheetId, tabName) {
  var ss = SpreadsheetApp.openById(sheetId);
  var sh = ss.getSheetByName(tabName);
  if (!sh) ss.insertSheet(tabName);
}

// Ensure headers match and delete any extra columns beyond 'Trip Fare'
function enforceSheetHeadersAndColumns(sheetId, tabName) {
  var ss = SpreadsheetApp.openById(sheetId);
  var sh = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
  var expectedHeaders = [
    'Timestamp',
    'Email Address',
    'Name',
    'Phone Number',
    'Email',
    'Message / Special Requirement',
    'Booking Type',
    'Trip Type',
    'Vehicle Preference',
    'Pickup Location',
    'Drop Location',
    'Travel Date',
    'Travel Time',
    'Package Type',
    'Return Date',
    'Trip Fare'
  ];

  // Set headers if first row empty
  if (sh.getLastRow() === 0) {
    sh.appendRow(expectedHeaders);
  } else {
    var range = sh.getRange(1, 1, 1, expectedHeaders.length);
    var current = range.getValues()[0];
    var needsUpdate = false;
    for (var i = 0; i < expectedHeaders.length; i++) {
      if ((current[i] || '') !== expectedHeaders[i]) { needsUpdate = true; break; }
    }
    if (needsUpdate) {
      range.setValues([expectedHeaders]);
    }
  }

  // Delete extra columns beyond Trip Fare
  var lastCol = sh.getLastColumn();
  var expectedCols = expectedHeaders.length;
  if (lastCol > expectedCols) {
    sh.deleteColumns(expectedCols + 1, lastCol - expectedCols);
  }

  // Enforce number/date formats to prevent mis-formatting (e.g., Trip Fare as date)
  try {
    // Travel Date (col 12) as date
    sh.getRange(2, 12, Math.max(1, sh.getMaxRows() - 1), 1).setNumberFormat('yyyy-mm-dd');
    // Travel Time (col 13) as time
    sh.getRange(2, 13, Math.max(1, sh.getMaxRows() - 1), 1).setNumberFormat('hh:mm');
    // Trip Fare (col 16) as number/currency-like
    sh.getRange(2, 16, Math.max(1, sh.getMaxRows() - 1), 1).setNumberFormat('#,##0');
  } catch (fmtErr) {
    console.warn('Failed to enforce number formats:', fmtErr);
  }
}

// Build a fingerprint to detect duplicate submissions
function makeBookingFingerprint(b) {
  return [
    String(b.email || '').trim().toLowerCase(),
    String(b.name || '').trim().toLowerCase(),
    String(b.phone || '').trim().toLowerCase(),
    String(b.bookingType || '').trim().toLowerCase(),
    String(b.vehicle || '').trim().toLowerCase(),
    String(b.pickup || '').trim().toLowerCase(),
    String(b.drop || '').trim().toLowerCase(),
    String(b.travelDate || '').trim().toLowerCase()
  ].join('|');
}

// Check recent rows for duplicate booking (same core fields in last 2 minutes)
function isDuplicateRecent(sh, b) {
  try {
    var lastRow = sh.getLastRow();
    if (lastRow < 2) return false; // no data rows yet
    var rowsToCheck = Math.min(50, lastRow - 1);
    var startRow = lastRow - rowsToCheck + 1; // include header at row 1, so +1
    var range = sh.getRange(startRow, 1, rowsToCheck, 16); // up to Trip Fare
    var values = range.getValues();
    var now = new Date();

    // Column indices (1-based):
    // 1 Timestamp, 2 Email Address, 3 Name, 4 Phone Number, 5 Email,
    // 7 Booking Type, 9 Vehicle, 10 Pickup, 11 Drop, 12 Travel Date, 13 Travel Time
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var ts = row[0];
      var emailAddr = String(row[1] || '').trim().toLowerCase();
      var name = String(row[2] || '').trim().toLowerCase();
      var phone = String(row[3] || '').trim().toLowerCase();
      var bookingType = String(row[6] || '').trim().toLowerCase();
      var vehicle = String(row[8] || '').trim().toLowerCase();
      var pickup = String(row[9] || '').trim().toLowerCase();
      var drop = String(row[10] || '').trim().toLowerCase();
      var travelDate = String(row[11] || '').trim().toLowerCase();

      if (
        emailAddr === String(b.email || '').trim().toLowerCase() &&
        name === String(b.name || '').trim().toLowerCase() &&
        phone === String(b.phone || '').trim().toLowerCase() &&
        bookingType === String(b.bookingType || '').trim().toLowerCase() &&
        vehicle === String(b.vehicle || '').trim().toLowerCase() &&
        pickup === String(b.pickup || '').trim().toLowerCase() &&
        drop === String(b.drop || '').trim().toLowerCase() &&
        travelDate === String(b.travelDate || '').trim().toLowerCase()
      ) {
        // Timestamp within last 2 minutes considered duplicate
        if (ts instanceof Date) {
          var diffMs = now.getTime() - ts.getTime();
          if (diffMs >= 0 && diffMs <= 2 * 60 * 1000) {
            return true;
          }
        } else {
          // If timestamp not a Date, still treat as duplicate on exact match
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.warn('Duplicate check failed:', err);
    return false; // fail-open to not block writes
  }
}

function appendDirectlyToSheet(b) {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sh = ss.getSheetByName(CONFIG.SHEET_TAB) || ss.insertSheet(CONFIG.SHEET_TAB);
  
  // Check if headers exist, if not add them
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      'Timestamp',
      'Email Address',       // Column B
      'Name', 
      'Phone Number',
      'Email',               // Column E
      'Message / Special Requirement',
      'Booking Type',
      'Trip Type',
      'Vehicle Preference',
      'Pickup Location',
      'Drop Location',
      'Travel Date',         // Now serves as start date for all bookings
      'Travel Time',
      'Package Type',
      'Return Date',         // Only used for outstation round trips
      'Trip Fare'            // Total Fare - Final amount to be paid
    ]);
  }
  
  // Duplicate prevention: cache + recent rows scan
  var cache = CacheService.getScriptCache();
  var fp = makeBookingFingerprint(b);
  var cached = cache.get(fp);
  if (cached) {
    console.log('Duplicate booking detected (cache) – skipping append');
    return;
  }
  // Mark as in-progress immediately to block parallel writes
  cache.put(fp, '1', 120);

  if (isDuplicateRecent(sh, b)) {
    console.log('Duplicate booking detected (recent rows) – skipping append');
    return;
  }

  // Ensure message field is always included (even if empty)
  const messageValue = b.message || '';

  // Force Local return date blank (avoid default date artifacts)
  const returnDateValue = (b.bookingType === 'Local') ? '' : (b.returnDate || '');

  // Sanitize trip fare to a number, empty if invalid
  function toNumberOrEmpty(v) {
    var n = Number(v);
    return isFinite(n) && !isNaN(n) ? Math.round(n * 100) / 100 : '';
  }
  const tripFareValue = toNumberOrEmpty(b.totalFare || b.tripFare);
  
  sh.appendRow([
    new Date(),
    b.email || '',           // Email Address (Column B)
    b.name || '',            // Name
    b.phone || '',           // Phone Number
    b.email || '',           // Email (Column E)
    messageValue,            // Message / Special Requirement (always included)
    b.bookingType || '',     // Booking Type
    b.tripType || '',        // Trip Type (already filtered in normalizeBooking)
    b.vehicle || '',         // Vehicle Preference
    b.pickup || '',          // Pickup Location
    b.drop || '',            // Drop Location
    b.travelDate || '',      // Travel Date (now serves as start date for all bookings)
    b.time || '',            // Travel Time (ALWAYS STORED)
    b.packageType || '',     // Package Type (already filtered in normalizeBooking)
    returnDateValue,         // Return Date (blank for local)
    tripFareValue            // Trip Fare - Total amount to be paid (sanitized)
  ]);

  // Mark in cache to avoid immediate duplicates for 2 minutes
  cache.put(fp, '1', 120);
}

function sendOwnerEmail(b) {
  var subject = 'Booking Confirmed – VM Tours and Travels';
  var html = buildEmailHtml(b);
  GmailApp.sendEmail(CONFIG.OWNER_EMAIL, subject, 'HTML only', { name: 'VM Tours & Travels', htmlBody: html });
}

function sendCustomerEmail(b) {
  var subject = 'Your Booking – VM Tours and Travels';
  var html = buildEmailHtml(b);
  GmailApp.sendEmail(b.email, subject, 'HTML only', { name: 'VM Tours & Travels', htmlBody: html });
}

function buildEmailHtml(b) {
  // Package pricing table (fixed package price + extra per-km beyond limit)
  function getPackageInfo(vehicleName) {
    var table = {
      'Sedan': { basePrice: 1995, extraPerKm: 18 },
      'Maruti Ertiga AC': { basePrice: 2495, extraPerKm: 18 },
      'Toyota Innova AC': { basePrice: 2695, extraPerKm: 18 },
      'Toyota Innova Crysta AC': { basePrice: 2895, extraPerKm: 20 },
      'Tempo Traveller Non-AC': { basePrice: 3995, extraPerKm: 20 },
      'Tempo Traveller AC': { basePrice: 4495, extraPerKm: 20 }
    };
    return table[vehicleName] || null;
  }

  var fareSection = '';
  if ((b.bookingType || '').toLowerCase() === 'package') {
    var pkg = getPackageInfo(String(b.vehicle || ''));
    var pkgPrice = pkg ? pkg.basePrice : '';
    var extraPerKm = pkg ? pkg.extraPerKm : '';
    fareSection = '<div style="margin-top:16px;padding:12px;background:#eef2ff;border-radius:8px;border-left:4px solid #4f46e5">'
      + '<h3 style="margin:0 0 8px;color:#3730a3;font-size:16px">Package Details</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px;color:#374151">'
      + '<div><b>Vehicle:</b> ' + escapeHtml(b.vehicle) + '</div>'
      + (pkgPrice !== '' ? '<div><b>Package Price:</b> ₹' + escapeHtml(pkgPrice) + '</div>' : '')
      + (extraPerKm !== '' ? '<div><b>Extra Charges:</b> ₹' + escapeHtml(extraPerKm) + '/km beyond package limit</div>' : '')
      + (b.packageType ? '<div><b>Package Type:</b> ' + escapeHtml(b.packageType) + '</div>' : '')
      + '</div></div>';
  } else if (b.totalFare) {
    fareSection = '<div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e">'
      + '<h3 style="margin:0 0 8px;color:#166534;font-size:16px">Fare Details</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px;color:#374151">'
      + '<div><b>Distance:</b> ' + escapeHtml(b.distance) + ' km</div>'
      + '<div><b>Price/km:</b> ₹' + escapeHtml(b.pricePerKm) + '</div>'
      + '<div><b>Days:</b> ' + escapeHtml(b.numberOfDays) + '</div>'
      + '<div><b>Base Fare:</b> ₹' + escapeHtml(b.baseFare) + '</div>'
      + '<div><b>Daily Charge:</b> ₹' + escapeHtml(b.dailyCharge) + '</div>'
      + '<div style="font-weight:bold;font-size:16px;color:#166534"><b>Total Fare:</b> ₹' + escapeHtml(b.totalFare) + '</div>'
      + '</div></div>';
  }
  
  return '<div style="font-family:Inter,Segoe UI,Arial;padding:16px;border-left:4px solid #22c55e;background:#f8fafc">'
    + '<h2 style="margin:0 0 4px;color:#111827">' + escapeHtml(b.name) + '</h2>'
    + '<div style="font-size:12px;color:#6b7280">Booking ID: ' + escapeHtml(b.id) + ' • ' + new Date().toLocaleString() + '</div>'
    + '<div style="margin-top:12px;display:flex;gap:24px;font-size:14px;color:#374151">'
    + '<div><div><b>Service:</b> ' + escapeHtml((b.bookingType||'').toLowerCase()) + '</div><div><b>Vehicle:</b> ' + escapeHtml(b.vehicle) + '</div></div>'
    + '<div><div><b>Pickup:</b> ' + escapeHtml(b.pickup) + '</div><div><b>Drop:</b> ' + escapeHtml(b.drop) + '</div><div><b>Date:</b> ' + escapeHtml(b.travelDate) + '</div><div><b>Time:</b> ' + escapeHtml(b.time) + '</div></div>'
    + '</div>'
    + '<hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb" />'
    + '<div style="font-size:14px;color:#374151"><div><b>Phone:</b> ' + escapeHtml(b.phone) + '</div><div><b>Email:</b> ' + escapeHtml(b.email) + '</div></div>'
    + fareSection
    + '</div>';
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]); });
}

// Calculate distance between two locations using Google Distance Matrix API
function calculateDistance(origin, destination) {
  try {
    console.log('=== DISTANCE CALCULATION START ===');
    console.log('Origin:', origin);
    console.log('Destination:', destination);
    console.log('API Key:', CONFIG.GOOGLE_DISTANCE_API_KEY.substring(0, 10) + '...');
    
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json?' +
      'origins=' + encodeURIComponent(origin) +
      '&destinations=' + encodeURIComponent(destination) +
      '&key=' + CONFIG.GOOGLE_DISTANCE_API_KEY;
    
    console.log('API URL:', url);
    
    const response = UrlFetchApp.fetch(url);
    const responseText = response.getContentText();
    console.log('Raw API response:', responseText);
    
    const data = JSON.parse(responseText);
    console.log('Parsed API response:', data);
    
    if (data.status === 'OK' && data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
      const element = data.rows[0].elements[0];
      console.log('Element status:', element.status);
      
      if (element.status === 'OK') {
        const distanceText = element.distance.text;
        const distanceValue = element.distance.value; // in meters
        const distanceKm = Math.round(distanceValue / 1000 * 100) / 100; // convert to km with 2 decimal places
        
        console.log('Distance calculated successfully:', distanceKm, 'km');
        console.log('=== DISTANCE CALCULATION END ===');
        return {
          success: true,
          distance: distanceKm,
          distanceText: distanceText
        };
      } else {
        console.error('Element status not OK:', element.status);
        console.log('=== DISTANCE CALCULATION END (FAILED) ===');
        return {
          success: false,
          error: 'Unable to calculate distance: ' + element.status
        };
      }
    } else {
      console.error('API response not OK:', data.status);
      console.error('Error message:', data.error_message);
      console.log('=== DISTANCE CALCULATION END (API ERROR) ===');
      return {
        success: false,
        error: 'Distance API error: ' + data.status + (data.error_message ? ' - ' + data.error_message : '')
      };
    }
  } catch (error) {
    console.error('Distance calculation exception:', error);
    console.log('=== DISTANCE CALCULATION END (EXCEPTION) ===');
    return {
      success: false,
      error: 'Network error: ' + error.toString()
    };
  }
}

// Calculate number of days between start and return date
function calculateNumberOfDays(startDate, returnDate) {
  if (!startDate) return 1; // Default to 1 day for local bookings
  
  const start = new Date(startDate);
  const end = returnDate ? new Date(returnDate) : start; // If no return date, same day
  
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
  
  return Math.max(1, daysDiff); // Minimum 1 day
}

// Fallback distance calculation for common Bangalore locations
function getFallbackDistance(origin, destination) {
  console.log('=== FALLBACK DISTANCE CALCULATION START ===');
  console.log('Origin:', origin);
  console.log('Destination:', destination);
  
  const locations = {
    'basavanagudi': { lat: 12.9438, lng: 77.5762 },
    'indiranagar': { lat: 12.9716, lng: 77.6412 },
    'marathahalli': { lat: 12.9581, lng: 77.7014 },
    'vijaynagar': { lat: 12.9702, lng: 77.5603 },
    'mgroad': { lat: 12.9716, lng: 77.5946 },
    'rajajinagar': { lat: 12.9784, lng: 77.5610 },
    'koramangala': { lat: 12.9279, lng: 77.6271 },
    'whitefield': { lat: 12.9698, lng: 77.7500 },
    'electroniccity': { lat: 12.8456, lng: 77.6603 },
    'hebbal': { lat: 13.0359, lng: 77.5970 }
  };
  
  const originKey = origin.toLowerCase().replace(/\s+/g, '');
  const destKey = destination.toLowerCase().replace(/\s+/g, '');
  
  console.log('Origin key:', originKey);
  console.log('Destination key:', destKey);
  console.log('Available locations:', Object.keys(locations));
  
  if (locations[originKey] && locations[destKey]) {
    console.log('Both locations found in database');
    console.log('Origin coordinates:', locations[originKey]);
    console.log('Destination coordinates:', locations[destKey]);
    
    // Calculate approximate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (locations[destKey].lat - locations[originKey].lat) * Math.PI / 180;
    const dLng = (locations[destKey].lng - locations[originKey].lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(locations[originKey].lat * Math.PI / 180) * Math.cos(locations[destKey].lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log('Calculated distance:', distance, 'km');
    console.log('=== FALLBACK DISTANCE CALCULATION END (SUCCESS) ===');
    return Math.round(distance * 100) / 100;
  } else {
    console.log('Location not found in database');
    console.log('Origin found:', !!locations[originKey]);
    console.log('Destination found:', !!locations[destKey]);
    console.log('=== FALLBACK DISTANCE CALCULATION END (NOT FOUND) ===');
    return 10; // Default fallback
  }
}

// Calculate fare based on distance, vehicle type, and number of days
function calculateFare(distance, vehicleType, numberOfDays, bookingType = 'Local') {
  // Normalize booking type to handle case variations
  const normalizedBookingType = bookingType.toLowerCase() === 'local' ? 'Local' : 
                               bookingType.toLowerCase() === 'outstation' ? 'Outstation' :
                               bookingType.toLowerCase() === 'package' ? 'Package' : 'Local';
  
  let baseFare;
  let pricePerKm;

  // For local trips, use distance-based pricing (multiply distance by fixed rate)
  if (normalizedBookingType === 'Local') {
    const distanceRate = VEHICLE_PRICING[vehicleType] || 20; // Default to 4+1 rate if vehicle not found
    baseFare = distance * distanceRate;
    pricePerKm = distanceRate; // Store the rate for display purposes
    console.log('Local trip pricing - Distance:', distance, 'km, Rate:', distanceRate, 'per km, Base Fare:', baseFare);
    
    // For local trips, total fare is just the base fare (no daily charge)
    const totalFare = baseFare;
    
    console.log('Local fare calculation:', {
      distance: distance,
      vehicleType: vehicleType,
      pricePerKm: pricePerKm,
      baseFare: baseFare,
      totalFare: totalFare
    });
    
    return {
      distance: distance,
      pricePerKm: pricePerKm,
      numberOfDays: 1, // Local trips are always 1 day
      baseFare: Math.round(baseFare * 100) / 100,
      dailyCharge: 0, // No daily charge for local trips
      totalFare: Math.round(totalFare * 100) / 100
    };
  } else if (normalizedBookingType === 'Outstation') {
    // For outstation trips, use outstation pricing
    const outstationRate = VEHICLE_PRICING.Outstation[vehicleType] || 11; // Default to Sedan rate if vehicle not found
    baseFare = distance * outstationRate;
    pricePerKm = outstationRate;
    console.log('Outstation trip pricing - Distance:', distance, 'km, Rate:', outstationRate, 'per km, Base Fare:', baseFare);
  } else {
    // For package trips, use traditional per-km pricing
    pricePerKm = VEHICLE_PRICING[vehicleType] || 16; // Default to Sedan price if vehicle not found
    baseFare = distance * pricePerKm;
    console.log('Package trip pricing - Distance:', distance, 'km, Price per km:', pricePerKm, 'Base Fare:', baseFare);
  }
  
  // For non-local trips, add daily charge
  const dailyCharge = 500 * numberOfDays;
  const totalFare = baseFare + dailyCharge;
  
  console.log('Fare calculation:', {
    distance: distance,
    vehicleType: vehicleType,
    bookingType: normalizedBookingType,
    pricePerKm: pricePerKm,
    numberOfDays: numberOfDays,
    baseFare: baseFare,
    dailyCharge: dailyCharge,
    totalFare: totalFare
  });
  
  return {
    distance: distance,
    pricePerKm: pricePerKm,
    numberOfDays: numberOfDays,
    baseFare: Math.round(baseFare * 100) / 100,
    dailyCharge: dailyCharge,
    totalFare: Math.round(totalFare * 100) / 100
  };
}