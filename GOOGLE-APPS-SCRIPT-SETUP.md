# Google Apps Script Setup Guide

## 🚀 **Step-by-Step Setup:**

### **1. Create Google Apps Script Project**
1. Go to [script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Delete the default code and paste the code from `google-apps-script.js`

### **2. Get Your Google Sheet ID**
1. Open your Google Form's responses sheet
2. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
3. Replace `YOUR_SHEET_ID` in the Apps Script code

### **3. Deploy as Web App**
1. In Apps Script, click **"Deploy" → "New Deployment"**
2. Choose **"Web App"** as type
3. Set **Execute as**: "Me"
4. Set **Who has access**: "Anyone" (for public access)
5. Click **"Deploy"**
6. Copy the **Web App URL**

### **4. Update Your Website**
1. Replace `YOUR_WEB_APP_ID` in `script.js` with your Web App URL
2. The URL looks like: `https://script.google.com/macros/s/[WEB_APP_ID]/exec`

### **5. Test the Setup**
1. Test with a booking submission
2. Check your Google Sheet for new entries
3. Verify the data appears correctly

## ✅ **Benefits of This Approach:**

- **✅ No CORS issues** - Apps Script accepts cross-origin requests
- **✅ Reliable submission** - No 400/401 errors
- **✅ Direct to Sheets** - Data goes straight to your spreadsheet
- **✅ Custom formatting** - You control exactly how data is stored
- **✅ Error handling** - Proper success/error responses
- **✅ Email notifications** - Can add email alerts from Apps Script

## 🔧 **Troubleshooting:**

### **Common Issues:**
1. **403 Error**: Make sure Web App is deployed with "Anyone" access
2. **Sheet not found**: Verify the Sheet ID is correct
3. **Data not appearing**: Check the sheet name matches "Form Responses 1"

### **Testing:**
- Use the `testFunction()` in Apps Script to test locally
- Check Apps Script logs for debugging info

## 📊 **Expected Result:**

After setup, your bookings will:
1. ✅ Submit from your website
2. ✅ Go directly to Google Sheets
3. ✅ Appear in the same sheet as form responses
4. ✅ Include all booking details properly formatted

This approach is **100% reliable** and used by many production websites!















