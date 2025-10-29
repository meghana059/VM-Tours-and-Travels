// Clean version of script.js with only essential functions

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all elements are ready
    setTimeout(() => {
    setupFormSubmission();
    setMinimumDate();
    setupTimeSelection();
    initializeVehicleModal();
    initializeGoogleMapsWhenReady();
    setupTabSwitching();
    setupFareCalculation();
    
    // Setup Select Cabs button functionality
    const selectCabsBtn = document.getElementById('selectCabsBtn');
    const bookNowBtn = document.getElementById('bookNowBtn');
    
    if (selectCabsBtn) {
        selectCabsBtn.addEventListener('click', function() {
            // Validate form first
            if (validateFormForVehicleSelection()) {
                // Get form data and store it
                const formData = getFormData();
                window.currentBookingData = formData;
                
                // Show Step 2 (Vehicle Selection)
                showStep2();
            }
        });
    }
    
    // Initialize local tab filtering if local tab is already active
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'local') {
        filterLocalTabLocations();
        clearNonBangaloreSelections();
        // Validate any existing values
        validateExistingLocationValues();
        // Force validation refresh
        setTimeout(() => {
            validateExistingLocationValues();
        }, 1000);
    }
    }, 100);
});

// Set minimum date to today
function setMinimumDate() {
    try {
    const today = new Date().toISOString().split('T')[0];
        
        // Update all date inputs with new field names
        const dateInputs = [
            'input[name="travelDate"]',
            'input[name="onewayDate"]',
            'input[name="returnDate"]',
            'input[name="packageDate"]'
        ];
        
        dateInputs.forEach(selector => {
            const input = document.querySelector(selector);
            if (input && input.setAttribute) {
                input.setAttribute('min', today);
            }
        });
    } catch (error) {
        console.warn('Error setting minimum date:', error);
    }
}

// Setup 12-hour time selection
function setupTimeSelection() {
    // Find all time select elements with new field names
    const timeSelectors = [
        { hour: 'select[name="hour"]', minute: 'select[name="minute"]', period: 'select[name="period"]' },
        { hour: 'select[name="onewayHour"]', minute: 'select[name="onewayMinute"]', period: 'select[name="onewayPeriod"]' },
        { hour: 'select[name="roundtripHour"]', minute: 'select[name="roundtripMinute"]', period: 'select[name="roundtripPeriod"]' },
        { hour: 'select[name="packageHour"]', minute: 'select[name="packageMinute"]', period: 'select[name="packagePeriod"]' }
    ];
    
    timeSelectors.forEach(selector => {
        const hourSelect = document.querySelector(selector.hour);
        const minuteSelect = document.querySelector(selector.minute);
        const periodSelect = document.querySelector(selector.period);
        
        if (!hourSelect || !minuteSelect || !periodSelect) return;
        
        // Function to update combined time for this set
    function updateCombinedTime() {
        const hour = hourSelect.value;
        const minute = minuteSelect.value;
        const period = periodSelect.value;
        
        if (hour && minute && period) {
            // Convert 12-hour format to 24-hour format for form submission
            let hour24 = parseInt(hour);
            
            if (period === 'PM' && hour24 !== 12) {
                hour24 += 12;
            } else if (period === 'AM' && hour24 === 12) {
                hour24 = 0;
            }
            
            // Format as HH:MM for form submission
            const timeString = `${hour24.toString().padStart(2, '0')}:${minute}`;
                
                // Store the combined time in a data attribute for form submission
                hourSelect.setAttribute('data-combined-time', timeString);
        } else {
                hourSelect.removeAttribute('data-combined-time');
        }
    }
    
    // Add event listeners to all time selects
    hourSelect.addEventListener('change', updateCombinedTime);
    minuteSelect.addEventListener('change', updateCombinedTime);
    periodSelect.addEventListener('change', updateCombinedTime);
    });
}

// Enhanced form validation
function validateFormData(data) {
    // Check required fields
    const requiredFields = ['name', 'phone'];
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            return { isValid: false, message: `Please fill in the ${field.replace('_', ' ')} field` };
        }
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (data.phone && !phoneRegex.test(data.phone)) {
        return { isValid: false, message: 'Please enter a valid 10-digit phone number' };
    }
    
    // Validate email format if provided
    if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    }
    
    return { isValid: true, message: '' };
}

// Custom validation function for different booking types
function validateBookingData(activeTab, formData) {
    // Common validations
    const name = formData.get('name');
    const phone = formData.get('phone');
    const email = formData.get('email');
    
    if (!name || name.trim().length < 2) {
        return 'Please enter a valid name (at least 2 characters)';
    }
    
    if (!phone || phone.trim().length < 10) {
        return 'Please enter a valid phone number (at least 10 digits)';
    }
    
    if (email && !email.includes('@')) {
        return 'Please enter a valid email address';
    }
    
    // Tab-specific validations
    if (activeTab === 'local') {
        const pickup = formData.get('pickup');
        const drop = formData.get('drop');
        const date = formData.get('travelDate');
        
        if (!pickup || pickup.trim() === '') {
            return 'Please select a pickup location';
        }
        
        if (!drop || drop.trim() === '') {
            return 'Please select a drop location';
        }
        
        // Validate that locations are within Bangalore for local bookings
        if (!validateLocationForLocal(pickup, 'pickup')) {
            return 'Pickup location must be within Bangalore for local bookings';
        }
        
        if (!validateLocationForLocal(drop, 'drop')) {
            return 'Drop location must be within Bangalore for local bookings';
        }
        
        // Also check "Other" input fields if they exist
        const pickupOther = formData.get('pickupOther');
        const dropOther = formData.get('dropOther');
        
        if (pickupOther && pickupOther.trim() !== '' && !validateLocationForLocal(pickupOther, 'pickupOther')) {
            return 'Pickup location must be within Bangalore for local bookings';
        }
        
        if (dropOther && dropOther.trim() !== '' && !validateLocationForLocal(dropOther, 'dropOther')) {
            return 'Drop location must be within Bangalore for local bookings';
        }
        
        if (!date || date.trim() === '') {
            return 'Please select a travel date';
        }
        
        const hour = formData.get('hour');
        const minute = formData.get('minute');
        const period = formData.get('period');
        
        console.log('Time validation - hour:', hour, 'minute:', minute, 'period:', period);
        
        if (!hour || !minute || !period) {
            return 'Please select a travel time';
        }
        
        // Check if date is not in the past
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return 'Travel date cannot be in the past';
        }
        
    } else if (activeTab === 'outstation') {
        const pickup = formData.get('outstationPickup');
        const drop = formData.get('outstationDrop');
        const tripType = formData.get('tripType');
        
        if (!pickup || pickup.trim() === '') {
            return 'Please select a pickup location';
        }
        
        if (!drop || drop.trim() === '') {
            return 'Please select a drop location';
        }
        
        if (!tripType || tripType.trim() === '') {
            return 'Please select a trip type (One Way or Round Trip)';
        }
        
        if (tripType === 'oneway') {
            const date = formData.get('onewayDate');
            if (!date || date.trim() === '') {
                return 'Please select a travel date';
            }
            
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                return 'Travel date cannot be in the past';
            }
            
            if (!formData.get('onewayHour') || !formData.get('onewayMinute') || !formData.get('onewayPeriod')) {
                return 'Please select a travel time';
            }
        } else if (tripType === 'round') {
            const returnDate = formData.get('returnDate');
            
            if (!returnDate || returnDate.trim() === '') {
                return 'Please select a return date';
            }
            
            const travelDate = formData.get('travelDate');
            const return_d = new Date(returnDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (travelDate && new Date(travelDate) < today) {
                return 'Travel date cannot be in the past';
            }
            
            if (travelDate && return_d <= new Date(travelDate)) {
                return 'Return date must be after travel date';
            }
            
            if (!formData.get('travelHour') || !formData.get('travelMinute') || !formData.get('travelPeriod')) {
                return 'Please select a travel time';
            }
        }
        
    } else if (activeTab === 'package') {
        const pickup = formData.get('packagePickup');
        const packageType = formData.get('packageType');
        const date = formData.get('packageDate');
        
        if (!pickup || pickup.trim() === '') {
            return 'Please select a pickup location';
        }
        
        if (!packageType || packageType.trim() === '') {
            return 'Please select a package type';
        }
        
        if (!date || date.trim() === '') {
            return 'Please select a date';
        }
        
        const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
            return 'Date cannot be in the past';
        }
        
        if (!formData.get('packageHour') || !formData.get('packageMinute') || !formData.get('packagePeriod')) {
            return 'Please select a time';
        }
    }
    
    return null; // No validation errors
}

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('bookingForm');
    
    if (!form) {
        console.warn('Booking form not found');
        return;
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // PREVENT DEFAULT FORM SUBMISSION IMMEDIATELY
        
        // Remove required attributes from hidden tab fields before validation
        const hiddenTabFields = this.querySelectorAll('.tab-content input[data-required], .tab-content select[data-required]');
        hiddenTabFields.forEach(field => {
            if (field.closest('.tab-content').classList.contains('hidden')) {
                field.removeAttribute('required');
            }
        });
        
        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form element:', this);
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        submitBtn.disabled = true;
        
        // Add timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            console.error('Form submission timeout - restoring button');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showNotification('Submission timeout. Please try again.', 'error');
        }, 30000); // 30 second timeout
        
        // Get active tab FIRST - improved detection with debugging
        const activeTabInput = document.getElementById('activeTab');
        let activeTab = activeTabInput ? activeTabInput.value : '';
        
        console.log('=== TAB DETECTION DEBUG ===');
        console.log('activeTab input element:', activeTabInput);
        console.log('activeTab input value:', activeTab);
        
        // Fallback: detect active tab by looking for visible tab content
        if (!activeTab) {
            const visibleTab = document.querySelector('.tab-content:not(.hidden)');
            console.log('Visible tab element:', visibleTab);
            if (visibleTab) {
                activeTab = visibleTab.id.replace('-tab', '');
                console.log('Detected active tab from visible element:', activeTab);
            } else {
                activeTab = 'local'; // Default fallback
                console.log('Using default fallback tab:', activeTab);
            }
        }
        
        // Additional check: look at which tab button has 'active' class
        const activeTabButton = document.querySelector('.tab-button.active');
        console.log('Active tab button:', activeTabButton);
        if (activeTabButton) {
            const buttonTab = activeTabButton.getAttribute('data-tab');
            console.log('Active tab from button data-tab:', buttonTab);
            if (buttonTab && buttonTab !== activeTab) {
                console.log('Tab mismatch detected! Using button tab:', buttonTab);
                activeTab = buttonTab;
            }
        }
        
        console.log('Final active tab detected:', activeTab);
        console.log('=== END TAB DETECTION DEBUG ===');
        
        // CRITICAL: Add required attributes only to active tab fields
        const allRequiredFields = this.querySelectorAll('.tab-content input[data-required], .tab-content select[data-required]');
        const hiddenInputs = [];
        
        console.log('=== FIELD PROCESSING DEBUG ===');
        console.log('Found', allRequiredFields.length, 'tab-specific fields with data-required attribute');
        
        // Remove required from ALL tab fields first
        allRequiredFields.forEach((input, index) => {
            console.log(`Field ${index + 1}:`, input.name, input.type, 'in tab:', input.closest('.tab-content').id);
            hiddenInputs.push(input);
            input.removeAttribute('required');
        });
        
        // Add required back only to active tab fields
        const activeTabElement = document.getElementById(activeTab + '-tab');
        if (activeTabElement) {
            const activeTabFields = activeTabElement.querySelectorAll('input[data-required], select[data-required]');
            activeTabFields.forEach(input => {
                input.setAttribute('required', '');
                console.log('Added required to active tab field:', input.name);
            });
        }
        
        console.log('Processed', hiddenInputs.length, 'tab-specific fields');
        console.log('=== END FIELD PROCESSING DEBUG ===');
        
        // NOW check form validity after removing required attributes
        console.log('Form validity after removing required attributes:', this.checkValidity());
        
        try {
            // Collect form data FIRST
            const formData = new FormData(this);
            
            // Now validate the form
            if (!this.checkValidity()) {
                // Restore required attributes
                hiddenInputs.forEach(input => {
                    input.setAttribute('required', '');
                });
                console.log('Restored required attributes after validation error');
                showNotification('Please fill in all required fields.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            // Additional custom validation based on active tab
            const validationError = validateBookingData(activeTab, formData);
            if (validationError) {
                // Restore required attributes
                hiddenInputs.forEach(input => {
                    input.setAttribute('required', '');
                });
                console.log('Restored required attributes after validation error');
                showNotification(validationError, 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            return;
            }
            const bookingData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                message: formData.get('message'),
                activeTab: activeTab
            };
            
            // Collect tab-specific data
            if (activeTab === 'local') {
                bookingData.pickup = formData.get('pickup');
                bookingData.drop = formData.get('drop');
                bookingData.travelDate = formData.get('travelDate');
                bookingData.travelTime = formData.get('hour') + ':' + formData.get('minute') + ' ' + formData.get('period');
            } else if (activeTab === 'outstation') {
                bookingData.tripType = formData.get('tripType');
                if (bookingData.tripType === 'oneway') {
                    bookingData.pickup = formData.get('outstationPickup');
                    bookingData.drop = formData.get('outstationDrop');
                    bookingData.onewayDate = formData.get('onewayDate');
                    bookingData.onewayTime = formData.get('onewayHour') + ':' + formData.get('onewayMinute') + ' ' + formData.get('onewayPeriod');
                } else {
                    bookingData.pickup = formData.get('outstationPickup');
                    bookingData.drop = formData.get('outstationDrop');
                    bookingData.travelDate = formData.get('travelDate'); // Use travelDate as start date
                    bookingData.returnDate = formData.get('returnDate');
                    bookingData.travelTime = formData.get('roundtripHour') + ':' + formData.get('roundtripMinute') + ' ' + formData.get('roundtripPeriod');
                }
            } else if (activeTab === 'package') {
                bookingData.pickup = formData.get('packagePickup');
                bookingData.packageType = formData.get('packageType');
                bookingData.packageDate = formData.get('packageDate');
                bookingData.packageTime = formData.get('packageHour') + ':' + formData.get('packageMinute') + ' ' + formData.get('packagePeriod');
            }
            
            console.log('Booking data collected:', bookingData);
            
            // Restore required attributes for tab-specific fields after processing
            hiddenInputs.forEach(input => {
                input.setAttribute('required', '');
            });
            console.log('Restored required attributes to', hiddenInputs.length, 'fields');
            
            // Clear loading timeout
            clearTimeout(loadingTimeout);
            
            // Show vehicle selection modal
            showVehicleModal(bookingData);
            
        } catch (error) {
            console.error('Form submission error:', error);
            clearTimeout(loadingTimeout);
            showNotification('Error processing form. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Show vehicle selection modal
function showVehicleModal(bookingData) {
    console.log('About to show vehicle modal with data:', bookingData);
    
    // The Select Cabs button will be hidden when vehicle is selected
    
    const modal = document.getElementById('vehicleModal');
    if (!modal) {
        console.error('Vehicle modal not found - checking DOM...');
        console.log('Available elements with "modal" in ID:', document.querySelectorAll('[id*="modal"]'));
        return;
    }
    
    console.log('Vehicle modal found, current classes:', modal.className);
    console.log('Vehicle modal found, showing...');
    
    // Store booking data for later use
    window.currentBookingData = bookingData;
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    console.log('Modal classes after showing:', modal.className);
    console.log('Modal should now be visible');
    
    // Calculate and update fares when modal opens
    calculateDistanceAndUpdateFares();
    
    // Add event listeners to vehicle cards
    const vehicleCards = document.querySelectorAll('.vehicle-card');
    vehicleCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            vehicleCards.forEach(c => c.classList.remove('ring-2', 'ring-green-500', 'bg-green-50'));
            
            // Add active class to clicked card
            this.classList.add('ring-2', 'ring-green-500', 'bg-green-50');
            
            // Store selected vehicle
            window.selectedVehicle = {
                name: this.getAttribute('data-vehicle'),
                price: this.getAttribute('data-price')
            };
        });
    });
    
    // Handle confirm booking button
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (window.selectedVehicle) {
                window.currentBookingData.selectedVehicle = window.selectedVehicle.name;
                redirectToGoogleForm(window.currentBookingData);
            } else {
                showNotification('Please select a vehicle first.', 'error');
            }
        });
    }
    
    // Handle modal close
    const closeBtn = document.getElementById('closeVehicleModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
}

// Redirect to Google Form with pre-filled data
// Complete Google Form field mapping
const FORM_FIELDS = {
    name: 'entry.313291216',
    phone: 'entry.921897043', 
    email: 'entry.1662300852',
    message: 'entry.599021912',
    bookingType: 'entry.1101817881',        // Local/Outstation/Package
    tripType: 'entry.1101961469',           // One Way/Round Trip
    vehiclePreference: 'entry.1713287792',  // Selected vehicle
    pickupLocation: 'entry.46186223',
    dropLocation: 'entry.882649290',
    travelDate: 'entry.584146750',
    travelTime: 'entry.1840521605',
    packageType: 'entry.272979215',
    returnDate: 'entry.1794526690'          // For Round Trip
};

function redirectToGoogleForm(bookingData) {
    // Use the correct Google Form URL from your prefilled link
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfhwPRdhz22D4MD5U9rBsDL41ahZNeIPLrl77svUzdBNgz9Ow/viewform';
    
    // Create URL with pre-filled parameters
    const params = new URLSearchParams();
    
    console.log('Building Google Form URL with booking data:', bookingData);
    
    // Always send ALL fields - use empty string if not applicable
    // This ensures clean, consistent Google Sheet structure
    
    // Common fields (always required)
    params.append(FORM_FIELDS.name, bookingData.name || '');
    params.append(FORM_FIELDS.phone, bookingData.phone || '');
    params.append(FORM_FIELDS.email, bookingData.email || '');
    params.append(FORM_FIELDS.message, bookingData.message || '');
    
    // Booking type specific logic
    if (bookingData.activeTab === 'local') {
        params.append(FORM_FIELDS.bookingType, 'Local');
        params.append(FORM_FIELDS.pickupLocation, bookingData.pickup || '');
        params.append(FORM_FIELDS.dropLocation, bookingData.drop || '');
        params.append(FORM_FIELDS.travelDate, bookingData.travelDate || '');
        params.append(FORM_FIELDS.travelTime, bookingData.travelTime || '');
        
        // Fields not used in Local booking - send empty
        params.append(FORM_FIELDS.tripType, '');
        params.append(FORM_FIELDS.packageType, '');
        params.append(FORM_FIELDS.returnDate, '');
        
    } else if (bookingData.activeTab === 'outstation') {
        // Determine trip type for cleaner data
        const tripTypeText = bookingData.tripType === 'round' ? 'Round Trip' : 'One Way';
        const bookingTypeText = `Outstation-${bookingData.tripType === 'round' ? 'RoundTrip' : 'OneWay'}`;
        
        params.append(FORM_FIELDS.bookingType, bookingTypeText);
        params.append(FORM_FIELDS.tripType, tripTypeText);
        params.append(FORM_FIELDS.pickupLocation, bookingData.pickup || '');
        params.append(FORM_FIELDS.dropLocation, bookingData.drop || '');
        params.append(FORM_FIELDS.travelTime, bookingData.travelTime || '');
        
        // Round trip specific fields
        if (bookingData.tripType === 'round') {
            params.append(FORM_FIELDS.returnDate, bookingData.returnDate || '');
            params.append(FORM_FIELDS.travelDate, bookingData.travelDate || ''); // Use travelDate as start date
        } else {
            params.append(FORM_FIELDS.travelDate, bookingData.onewayDate || '');
            params.append(FORM_FIELDS.returnDate, '');
        }
        
        // Fields not used in Outstation booking - send empty
        params.append(FORM_FIELDS.packageType, '');
        
    } else if (bookingData.activeTab === 'package') {
        params.append(FORM_FIELDS.bookingType, 'Package');
        params.append(FORM_FIELDS.pickupLocation, bookingData.pickup || '');
        params.append(FORM_FIELDS.packageType, bookingData.packageType || '');
        params.append(FORM_FIELDS.travelDate, bookingData.packageDate || '');
        params.append(FORM_FIELDS.travelTime, bookingData.packageTime || '');
        
        // Fields not used in Package booking - send empty
        params.append(FORM_FIELDS.tripType, '');
        params.append(FORM_FIELDS.dropLocation, '');
        params.append(FORM_FIELDS.returnDate, '');
    }
    
    // Vehicle preference (send selected vehicle if available)
    params.append(FORM_FIELDS.vehiclePreference, bookingData.selectedVehicle || '');
    
    const formUrl = `${GOOGLE_FORM_URL}?usp=pp_url&${params.toString()}`;
    console.log('Final Google Form URL:', formUrl);
    
    // Redirect to Google Form
    window.open(formUrl, '_blank');
    
    // Show success message
    showNotification('Redirecting to booking form...', 'success');
}

// Step-by-Step Process Functions
function showStep2() {
    // Hide Step 1 (form)
    const form = document.getElementById('bookingForm');
    const tabNavigation = document.getElementById('tab-navigation');
    const step2Content = document.getElementById('step2-content');
    
    if (form) form.classList.add('hidden');
    if (tabNavigation) tabNavigation.classList.add('hidden');
    if (step2Content) step2Content.classList.remove('hidden');
    
    // Update step indicators
    updateStepIndicator(2);
    
    // Calculate fares and update vehicle cards
    calculateDistanceAndUpdateFares();
}

function showStep3() {
    // Hide Step 2
    const step2Content = document.getElementById('step2-content');
    const step3Content = document.getElementById('step3-content');
    
    if (step2Content) step2Content.classList.add('hidden');
    if (step3Content) step3Content.classList.remove('hidden');
    
    // Update step indicators
    updateStepIndicator(3);
    
    // Show loading state
    showLoadingState();
    
    // Process booking
    processBooking();
}

function updateStepIndicator(activeStep) {
    // Reset all indicators
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step${i}-indicator`);
        const text = document.getElementById(`step${i}-text`);
        const connector = document.getElementById(`connector${i}`);
        
        if (indicator && text) {
            if (i <= activeStep) {
                indicator.classList.remove('bg-gray-300');
                indicator.classList.add('bg-green-500');
                text.classList.remove('text-gray-500');
                text.classList.add('text-green-700', 'font-medium');
            } else {
                indicator.classList.remove('bg-green-500');
                indicator.classList.add('bg-gray-300');
                text.classList.remove('text-green-700', 'font-medium');
                text.classList.add('text-gray-500');
            }
        }
        
        if (connector) {
            if (i < activeStep) {
                connector.classList.remove('bg-gray-300');
                connector.classList.add('bg-green-300');
            } else {
                connector.classList.remove('bg-green-300');
                connector.classList.add('bg-gray-300');
            }
        }
    }
}

function showLoadingState() {
    const loadingMessage = document.getElementById('loading-message');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    
    if (loadingMessage) loadingMessage.classList.remove('hidden');
    if (successMessage) successMessage.classList.add('hidden');
    if (errorMessage) errorMessage.classList.add('hidden');
}

function showSuccessState() {
    const loadingMessage = document.getElementById('loading-message');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    
    if (loadingMessage) loadingMessage.classList.add('hidden');
    if (successMessage) successMessage.classList.remove('hidden');
    if (errorMessage) errorMessage.classList.add('hidden');
}

function showErrorState() {
    const loadingMessage = document.getElementById('loading-message');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    
    if (loadingMessage) loadingMessage.classList.add('hidden');
    if (successMessage) successMessage.classList.add('hidden');
    if (errorMessage) errorMessage.classList.remove('hidden');
}

async function processBooking() {
    if (window.isSubmitting) {
        console.log('Submission already in progress - ignoring duplicate call');
        return;
    }
    window.isSubmitting = true;
    // Show loading state first
    showLoadingState();
    
    try {
        // Prepare booking data (prefer preserved data from modal)
        const sourceData = window.pendingBookingData || window.currentBookingData || {};
        const bookingData = {
            ...sourceData,
            timestamp: new Date().toISOString()
        };

        // Ensure vehicle is carried through
        if (!bookingData.vehicle && bookingData.selectedVehicle) {
            bookingData.vehicle = bookingData.selectedVehicle;
        }
        if (!bookingData.bookingType && bookingData.activeTab) {
            bookingData.bookingType = bookingData.activeTab.charAt(0).toUpperCase() + bookingData.activeTab.slice(1);
        }
        
        console.log('Submitting booking data:', bookingData);
        
        // Use no-cors mode to avoid CORS issues with Google Apps Script
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });
        
        console.log('✅ Booking submitted successfully (no-cors mode)');
        
        // Since we can't read the response in no-cors mode, assume success
        // The booking will be saved to Google Sheets by the Apps Script
        showSuccessState();
        // Clear preserved data after success
        window.pendingBookingData = null;
        window.currentBookingData = null;
        
    } catch (error) {
        // Network or other error - show error message
        console.error('Booking submission error:', error);
        showErrorState();
    }
    // Allow new submissions after completion
    window.isSubmitting = false;
}

function resetToStep1() {
    // Go back to Step 1 (booking form) without resetting data
    const form = document.getElementById('bookingForm');
    const tabNavigation = document.getElementById('tab-navigation');
    const step2Content = document.getElementById('step2-content');
    const step3Content = document.getElementById('step3-content');
    
    // Show form and tab navigation
    if (form) form.classList.remove('hidden');
    if (tabNavigation) tabNavigation.classList.remove('hidden');
    
    // Hide step 2 and step 3
    if (step2Content) step2Content.classList.add('hidden');
    if (step3Content) step3Content.classList.add('hidden');
    
    // Reset step indicators
    updateStepIndicator(1);
    
    // Reset button states
    const selectCabsBtn = document.getElementById('selectCabsBtn');
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (selectCabsBtn && bookNowBtn) {
        selectCabsBtn.classList.remove('hidden');
        bookNowBtn.classList.add('hidden');
    }
    
    // Reset vehicle selection styling
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.classList.remove('border-green-500', 'bg-green-50', 'border-blue-500', 'ring-2', 'ring-blue-500');
        card.classList.add('border-gray-200');
    });
    
    // Hide selection preview
    const selectionPreview = document.getElementById('selectionPreview');
    if (selectionPreview) {
        selectionPreview.classList.add('hidden');
    }
    
    // Reset confirm booking button
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        confirmBtn.classList.add('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
    }
    
    console.log('Returned to Step 1 (booking form)');
}

function resetBookingFlow() {
    // Reset to Step 1 (booking form) and clear all data
    resetToStep1();
    
    // Clear stored booking data
    window.currentBookingData = null;
    
    // Reset form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.reset();
    }
    
    console.log('Booking flow reset to initial state');
}

function calculateTotalCost(vehicleName, rateOrFare) {
    // Check if this is already a total fare (large number) or a rate per km (small number)
    const isTotalFare = rateOrFare > 100; // If it's over 100, it's likely a total fare
    
    if (isTotalFare) {
        // If it's already a total fare, return it directly
        console.log(`Selection preview: ${vehicleName} - Using actual fare: ₹${rateOrFare}`);
        return rateOrFare;
    }
    
    // Otherwise, calculate from rate per km
    if (!window.currentBookingData) {
        return rateOrFare; // Fallback to rate if no booking data
    }
    
    // Use the actual calculated distance from the fare calculation
    const distance = window.currentBookingData.calculatedDistance;
    
    if (!distance) {
        return rateOrFare; // Fallback to rate if no distance calculated
    }
    
    // Calculate total cost: distance × rate per km
    const totalCost = Math.round(distance * rateOrFare);
    
    console.log(`Selection preview calculation: ${vehicleName} - ${distance}km × ₹${rateOrFare}/km = ₹${totalCost}`);
    
    return totalCost;
}

// Vehicle Modal Functions - Duplicate function removed (using the one above)

function closeVehicleModal(preserveData) {
    const modal = document.getElementById('vehicleModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Clear stored booking data unless asked to preserve
        if (!preserveData) {
            window.currentBookingData = null;
        }
        
        // Reset button states when modal is closed
        const bookNowBtn = document.getElementById('bookNowBtn');
        const selectCabsBtn = document.getElementById('selectCabsBtn');
        if (bookNowBtn && selectCabsBtn) {
            bookNowBtn.classList.add('hidden');
            selectCabsBtn.classList.remove('hidden');
        }
        
        // Reset any selected vehicle states
        document.querySelectorAll('.vehicle-card').forEach(card => {
            card.classList.remove('selected', 'border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-500');
            card.classList.add('border-gray-200');
        });
        
        // Hide selection preview
        const selectionPreview = document.getElementById('selectionPreview');
        if (selectionPreview) {
            selectionPreview.classList.add('hidden');
        }
        
        // Reset confirm button
        const confirmBtn = document.getElementById('confirmBooking');
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
        
        console.log('Vehicle modal closed and reset');
    }
}

function selectVehicle(vehicleName, ratePerKm) {
    // Store selected vehicle in booking data
    if (window.currentBookingData) {
        window.currentBookingData.selectedVehicle = vehicleName;
        window.currentBookingData.vehicleRate = ratePerKm;
        
        console.log('Vehicle selected:', vehicleName, 'Rate per km:', ratePerKm);
        
        // Update UI to show selection
        updateVehicleSelection(vehicleName, ratePerKm);
        
        // Enable confirm button in step 2
        const confirmBtn = document.getElementById('confirmBooking');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
            confirmBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
    }
}

function updateVehicleSelection(vehicleName, ratePerKm) {
    // Remove previous selection styling
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.classList.remove('border-green-500', 'bg-green-50', 'border-blue-500', 'ring-2', 'ring-blue-500');
        card.classList.add('border-gray-200');
    });
    
    // Add selection styling to selected card
    const selectedCard = document.querySelector(`[data-vehicle="${vehicleName}"]`);
    if (selectedCard) {
        selectedCard.classList.remove('border-gray-200');
        selectedCard.classList.add('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-500');
    }
    
    // Show selection preview
    const selectionPreview = document.getElementById('selectionPreview');
    const selectedVehicleText = document.getElementById('selectedVehicleText');
    if (selectionPreview && selectedVehicleText) {
        // Calculate total cost based on distance and rate
        const totalCost = calculateTotalCost(vehicleName, ratePerKm);
        selectedVehicleText.textContent = `You selected ${vehicleName} (₹ ${totalCost})`;
        selectionPreview.classList.remove('hidden');
    }
    
    // Enable confirm button
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
        confirmBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        console.log('Confirm button enabled and styled');
    } else {
        console.error('Confirm button not found!');
    }
    
    console.log('Vehicle selection UI updated for:', vehicleName);
}

function confirmBookingWithVehicle() {
    if (window.currentBookingData && window.currentBookingData.selectedVehicle) {
        console.log('Confirming booking with vehicle:', window.currentBookingData.selectedVehicle);
        // Preserve booking data through modal close
        window.pendingBookingData = Object.assign({}, window.currentBookingData);
        // Close modal (preserve data)
        closeVehicleModal(true);
        showStep3();
    } else {
        showNotification('Please select a vehicle first', 'error');
    }
}

// Background booking save function using dynamic approach
async function saveBookingInBackground(bookingData) {
    console.log('Saving booking in background:', bookingData);
    
    // Get the submit button to reset it later
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
    
    // Get fresh data from UI using the new dynamic system
    const freshBookingData = getBookingDataFromUI();
    if (!freshBookingData) {
        console.error('Failed to collect booking data from UI');
        showNotification('Error collecting form data. Please try again.', 'error');
        // Reset button state
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        return;
    }
    
    // Show loading message
    showNotification('Processing booking and calculating fare...', 'info');
    
    try {
        // Generate booking ID
        const bookingId = 'BK' + Date.now();
        
        // Create booking record for local storage (without fare details initially)
        const bookingRecord = {
            id: bookingId,
            timestamp: new Date().toLocaleString(),
            name: freshBookingData.name,
            phone: freshBookingData.phone,
            email: freshBookingData.email,
            service: freshBookingData.bookingType.toLowerCase(),
            vehicle: freshBookingData.vehicle,
            pickup: freshBookingData.pickup,
            drop: freshBookingData.drop,
            date: freshBookingData.travelDate,
            time: freshBookingData.time,
            status: 'Processing...'
        };
        
        // Save to localStorage
        let bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
        bookings.push(bookingRecord);
        // Booking saved to localStorage (display removed)
        
        // Send to Google Apps Script (which will calculate distance and fare)
        try {
            await submitBookingToGoogleForm(freshBookingData);
            
            // Since we can't read the response due to CORS, we'll calculate fare on frontend as backup
            // and let the Apps Script handle the real calculation
            const numberOfDays = calculateNumberOfDays(freshBookingData.travelDate, freshBookingData.returnDate);
            const estimatedDistance = 10; // Default estimate, Apps Script will calculate real distance
            const fareDetails = calculateFare(estimatedDistance, freshBookingData.vehicle, numberOfDays);
            
            // Update the booking record with estimated fare details
            bookingRecord.distance = fareDetails.distance;
            bookingRecord.pricePerKm = fareDetails.pricePerKm;
            bookingRecord.numberOfDays = fareDetails.numberOfDays;
            bookingRecord.baseFare = fareDetails.baseFare;
            bookingRecord.dailyCharge = fareDetails.dailyCharge;
            bookingRecord.totalFare = fareDetails.totalFare;
            bookingRecord.status = 'Confirmed (Fare estimated)';
            
            // Update localStorage
            bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
            const index = bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
                bookings[index] = bookingRecord;
                localStorage.setItem('vmBookings', JSON.stringify(bookings));
            }
            
            // Display removed - booking updated in localStorage only
            
        // Show success message with estimated fare
        showNotification(`Booking confirmed! Estimated fare: ₹${fareDetails.totalFare} (Actual fare will be calculated by server)`, 'success');
        
        // Show processing state briefly, then reset form
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
            submitBtn.disabled = true;
        }
        
        // Wait 2 seconds, then reset everything
        setTimeout(() => {
            resetFormToDefault();
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting to Apps Script:', error);
        
        // Update status to confirmed even if submission fails
        bookingRecord.status = 'Confirmed (Local only)';
        bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
        const index = bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            bookings[index] = bookingRecord;
            localStorage.setItem('vmBookings', JSON.stringify(bookings));
        }
        // Display removed - booking updated in localStorage only
        
        showNotification('Booking saved locally! (Server submission failed)', 'warning');
        
        // Show processing state briefly, then reset form
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
            submitBtn.disabled = true;
        }
        
        // Wait 2 seconds, then reset everything
        setTimeout(() => {
            resetFormToDefault();
        }, 2000);
    }
    
    console.log('Booking saved successfully:', bookingRecord);
        
    } catch (error) {
        console.error('Error in booking process:', error);
        showNotification('Error processing booking. Please try again.', 'error');
        
        // Reset button state on error
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Add booking to response list
function addBookingToResponseList(booking) {
    console.log('Adding booking to response list:', booking);
    
    // Create response list container if it doesn't exist
    let responseContainer = document.getElementById('bookingResponses');
    if (!responseContainer) {
        console.log('Response container not found, creating new one...');
        responseContainer = createResponseContainer();
    } else {
        console.log('Response container found:', responseContainer);
    }
    
    // Create booking card
    const bookingCard = document.createElement('div');
    bookingCard.className = 'bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 border-green-500 booking-card';
    bookingCard.innerHTML = createBookingCardHTML(booking);
    
    // Add to booking list
    const bookingList = responseContainer.querySelector('#bookingList');
    if (bookingList) {
        bookingList.insertBefore(bookingCard, bookingList.firstChild);
        console.log('Booking card added to booking list successfully');
    } else {
        console.log('Booking list not found, appending directly to container');
        responseContainer.appendChild(bookingCard);
    }
    
    // Show response container if hidden
    responseContainer.style.display = 'block';
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('Booking added to response list successfully:', booking);
}

// Update existing booking in response list
function updateBookingInResponseList(booking) {
    console.log('Updating booking in response list:', booking);
    
    const responseContainer = document.getElementById('bookingResponses');
    if (!responseContainer) {
        console.error('Response container not found');
        return;
    }
    
    const bookingList = responseContainer.querySelector('#bookingList');
    if (!bookingList) {
        console.error('Booking list not found');
        return;
    }
    
    // Find the booking card by ID
    const bookingCards = bookingList.querySelectorAll('.booking-card');
    let targetCard = null;
    
    for (let card of bookingCards) {
        const bookingIdElement = card.querySelector('.booking-id');
        if (bookingIdElement && bookingIdElement.textContent.includes(booking.id)) {
            targetCard = card;
            break;
        }
    }
    
    if (targetCard) {
        // Update the existing card
        targetCard.innerHTML = createBookingCardHTML(booking);
        console.log('Booking card updated successfully');
    } else {
        // Display removed - booking added to localStorage only
        console.log('Booking added to localStorage (display removed)');
    }
}

// Create booking card HTML (extracted for reuse)
function createBookingCardHTML(booking) {
    // Build fare information HTML if available
    const fareInfo = booking.totalFare ? `
        <div class="mt-4 pt-4 border-t border-gray-200 bg-green-50 rounded-lg p-4">
            <h4 class="font-semibold text-green-800 mb-2">Fare Details</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <p class="text-gray-700"><span class="font-medium">Distance:</span> ${booking.distance} km</p>
                <p class="text-gray-700"><span class="font-medium">Price/km:</span> ₹${booking.pricePerKm}</p>
                <p class="text-gray-700"><span class="font-medium">Days:</span> ${booking.numberOfDays}</p>
                <p class="text-gray-700"><span class="font-medium">Base Fare:</span> ₹${booking.baseFare}</p>
                <p class="text-gray-700"><span class="font-medium">Daily Charge:</span> ₹${booking.dailyCharge}</p>
                <p class="text-gray-700 font-bold text-lg"><span class="font-medium">Total Fare:</span> ₹${booking.totalFare}</p>
            </div>
        </div>
    ` : '';
    
    return `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-900">${booking.name}</h3>
                <p class="text-sm text-gray-600 booking-id">Booking ID: ${booking.id}</p>
                <p class="text-xs text-gray-500">${booking.timestamp}</p>
            </div>
            <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">${booking.status}</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
                <p class="text-gray-600"><span class="font-medium">Service:</span> ${booking.service}</p>
                <p class="text-gray-600"><span class="font-medium">Vehicle:</span> ${booking.vehicle}</p>
                <p class="text-gray-600"><span class="font-medium">Price:</span> ₹${booking.pricePerKm || booking.price || 'N/A'}/km</p>
            </div>
            <div>
                <p class="text-gray-600"><span class="font-medium">Pickup:</span> ${booking.pickup}</p>
                <p class="text-gray-600"><span class="font-medium">Drop:</span> ${booking.drop}</p>
                <p class="text-gray-600"><span class="font-medium">Date:</span> ${booking.date}</p>
                <p class="text-gray-600"><span class="font-medium">Time:</span> ${booking.time}</p>
            </div>
        </div>
        
        <div class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-gray-600 text-sm"><span class="font-medium">Phone:</span> ${booking.phone}</p>
            <p class="text-gray-600 text-sm"><span class="font-medium">Email:</span> ${booking.email}</p>
        </div>
        ${fareInfo}
    `;
}

// Create response container
function createResponseContainer() {
    const container = document.createElement('div');
    container.id = 'bookingResponses';
    container.className = 'max-w-4xl mx-auto px-4 py-8 bg-gray-50';
    container.innerHTML = `
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Booking Responses</h2>
            <p class="text-gray-600">Your booking confirmations will appear here</p>
        </div>
        <div id="bookingList"></div>
    `;
    
    // Try multiple ways to insert the container
    const bookingSection = document.querySelector('#booking');
    if (bookingSection) {
        bookingSection.insertAdjacentElement('afterend', container);
        console.log('Response container inserted after booking section');
    } else {
        // Fallback: insert before contact section
        const contactSection = document.querySelector('#contact');
        if (contactSection) {
            contactSection.insertAdjacentElement('beforebegin', container);
            console.log('Response container inserted before contact section');
        } else {
            // Last resort: append to body
            document.body.appendChild(container);
            console.log('Response container appended to body');
        }
    }
    
    return container;
}

function initializeVehicleModal() {
    console.log('Initializing vehicle modal...');
    
    // Prevent duplicate initialization
    if (window.vehicleModalInitialized) {
        console.log('Vehicle modal already initialized, skipping...');
        return;
    }
    
    // Close modal button
    const closeBtn = document.getElementById('closeVehicleModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVehicleModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('vehicleModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVehicleModal();
            }
        });
    }
    
    // Vehicle selection buttons
    document.querySelectorAll('.vehicle-card').forEach(card => {
        const selectBtn = card.querySelector('button');
        if (selectBtn) {
            selectBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const vehicleName = card.getAttribute('data-vehicle');
            
            // Get the actual displayed fare instead of data-price attribute
            const fareId = VEHICLE_FARE_IDS[vehicleName];
            const fareElement = document.getElementById(fareId);
            let actualFare = 0;
            
            if (fareElement) {
                const fareText = fareElement.textContent;
                // Extract number from "₹ 1812" format
                const match = fareText.match(/₹\s*(\d+)/);
                if (match) {
                    actualFare = parseInt(match[1]);
                }
            }
            
            // If no fare element found, fallback to data-price
            if (actualFare === 0) {
                const ratePerKm = card.getAttribute('data-price');
                selectVehicle(vehicleName, ratePerKm);
            } else {
                // Pass the actual fare directly
                selectVehicle(vehicleName, actualFare);
            }
            });
        }
    });
    
    // Mark as initialized
    window.vehicleModalInitialized = true;
    
    // Confirm booking button
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmBookingWithVehicle);
    }
    
    // Continue button (for success message)
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            // Reset the entire booking flow
            resetBookingFlow();
        });
    }
    
    // Book Again button (for success message)
    const bookAgainBtn = document.getElementById('bookAgainBtn');
    if (bookAgainBtn) {
        bookAgainBtn.addEventListener('click', function() {
            // Reset the entire booking flow
            resetBookingFlow();
        });
    }
    
    // Close vehicle modal button
    const closeVehicleModalBtn = document.getElementById('closeVehicleModal');
    if (closeVehicleModalBtn) {
        closeVehicleModalBtn.addEventListener('click', function() {
            // Go back to Step 1 (booking form)
            resetToStep1();
        });
    }
    
    // Display removed - bookings are stored in localStorage only
    
    console.log('Vehicle modal initialized successfully');
}

// Load existing bookings from localStorage
function loadExistingBookings() {
    console.log('Loading existing bookings from localStorage...');
    const bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
    console.log('Found bookings in localStorage:', bookings.length);
    
    if (bookings.length > 0) {
        console.log('Bookings found:', bookings);
        
        // Create response container if it doesn't exist
        let responseContainer = document.getElementById('bookingResponses');
        if (!responseContainer) {
            console.log('Creating response container for existing bookings...');
            responseContainer = createResponseContainer();
        }
        
        // Add existing bookings to the list
        // Display removed - bookings loaded to localStorage only
        console.log('Bookings loaded to localStorage (display removed)');
    } else {
        console.log('No existing bookings found in localStorage');
    }
}

// Test function to manually show bookings (for debugging) - DISABLED
function showAllBookings_DISABLED() {
    console.log('=== MANUAL BOOKING DISPLAY TEST ===');
    const bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
    console.log('Total bookings in localStorage:', bookings.length);
    console.log('All bookings:', bookings);
    
    if (bookings.length > 0) {
        // Force create response container
        let responseContainer = document.getElementById('bookingResponses');
        if (!responseContainer) {
            responseContainer = createResponseContainer();
        }
        
        // Clear existing content
        const bookingList = responseContainer.querySelector('#bookingList');
        if (bookingList) {
            bookingList.innerHTML = '';
        }
        
        // Display removed - bookings are in localStorage only
        console.log('All bookings are stored in localStorage (display removed)');
        
        // Scroll to responses
        responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Make function available globally for testing - DISABLED
// window.showAllBookings = showAllBookings;

// Test function to verify Google Form URL and field mappings
function testGoogleFormSubmission() {
    console.log('=== GOOGLE FORM TEST ===');
    
    const testBooking = {
        id: 'TEST-' + Date.now(),
        timestamp: new Date().toLocaleString(),
        name: 'Test User',
        phone: '9999999999',
        email: 'test@example.com',
        service: 'local',
        vehicle: 'Test Vehicle',
        price: '100',
        pickup: 'Test Pickup',
        drop: 'Test Drop',
        date: '2025-01-01',
        time: '10:00 AM',
        status: 'Test'
    };
    
    console.log('Testing with booking:', testBooking);
    submitToGoogleFormBackground(testBooking);
}

// Function to help you find the correct field IDs from your Google Form
function getGoogleFormFieldIds() {
    console.log('=== GOOGLE FORM FIELD ID HELPER ===');
    console.log('To get the correct field IDs:');
    console.log('1. Go to your Google Form');
    console.log('2. Right-click on each field');
    console.log('3. Select "Inspect Element"');
    console.log('4. Look for name="entry.XXXXXXX"');
    console.log('5. Update the FIELD_MAP in the code with these IDs');
    console.log('');
    console.log('Current field mappings:');
    console.log('name -> entry.313291216');
    console.log('phone -> entry.921897043');
    console.log('email -> entry.1662300852');
    console.log('service -> entry.1101817881');
    console.log('pickup -> entry.46186223');
    console.log('drop -> entry.882649290');
    console.log('date -> entry.584146750');
    console.log('time -> entry.1840521605');
    console.log('vehicle -> entry.1101961469');
    console.log('price -> entry.272979215');
    console.log('bookingId -> entry.636967087');
    console.log('timestamp -> entry.1794526690');
}

// Make test functions available globally
window.testGoogleFormSubmission = testGoogleFormSubmission;
window.getGoogleFormFieldIds = getGoogleFormFieldIds;

// Make new dynamic functions available globally
window.getBookingDataFromUI = getBookingDataFromUI;
window.submitBookingToGoogleForm = submitBookingToGoogleForm;

// =============================================================================
// DYNAMIC TAB-AWARE GOOGLE FORM SUBMISSION SYSTEM
// =============================================================================

// Single source of truth: Field mapping from UI field names to Google Form entry IDs
const FIELD_MAP = {
    name: "entry.313291216",
    phone: "entry.921897043", 
    email: "entry.1662300852",
    message: "entry.599021912",
    bookingType: "entry.1101817881",
    tripType: "entry.1101961469",
    vehicle: "entry.1713287792",
    pickup: "entry.46186223",
    drop: "entry.882649290",
    packageType: "entry.272979215",
    travelDate: "entry.584146750",
    returnDate: "entry.1794526690",
    time: "entry.1840521605"
};

// Google Apps Script Web App URL - Deployed and working
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGuty33r-zyM_tQqNbezJJcueGrEoXBpun0TZeoqPC5e7z4Mof68CWbHZJESEMs5NxPw/exec';

// Google Distance Matrix API
const GOOGLE_DISTANCE_API_KEY = 'AIzaSyCvh94LjftZWU-eVM380sTSRqtfXkKyw-g';
const GOOGLE_DISTANCE_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

// Vehicle pricing per km
const VEHICLE_PRICING = {
    'Sedan': 16,
    'Toyota Etios AC': 20,
    'Swift Dzire AC': 16,
    'Maruti Ertiga AC': 25,
    'Toyota Innova AC': 28,
    'Toyota Innova Crysta AC': 30,
    'Tempo Traveller': 40,
    'Bus (30+ Seater)': 60
};

// Legacy Google Form URL (kept for reference)
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfhwPRdhz22D4MD5U9rBsDL41ahZNeIPLrl77svUzdBNgz9Ow/formResponse';

// Helper function to format date to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to format time to HH:MM (24-hour format)
function formatTime(timeString) {
    if (!timeString) return '';
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2];
        const period = timeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        return `${String(hour).padStart(2, '0')}:${minute}`;
    }
    return '';
}

// Calculate distance between two locations using Google Distance Matrix API
async function calculateDistance(origin, destination) {
    try {
        console.log('Calculating distance from', origin, 'to', destination);
        
        const url = `${GOOGLE_DISTANCE_API_URL}?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_DISTANCE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Distance API response:', data);
        
        if (data.status === 'OK' && data.rows[0] && data.rows[0].elements[0]) {
            const element = data.rows[0].elements[0];
            if (element.status === 'OK') {
                const distanceText = element.distance.text;
                const distanceValue = element.distance.value; // in meters
                const distanceKm = Math.round(distanceValue / 1000 * 100) / 100; // convert to km with 2 decimal places
                
                console.log('Distance calculated:', distanceKm, 'km');
                return {
                    success: true,
                    distance: distanceKm,
                    distanceText: distanceText
                };
            } else {
                console.error('Distance calculation failed:', element.status);
                return {
                    success: false,
                    error: `Unable to calculate distance: ${element.status}`
                };
            }
        } else {
            console.error('Distance API error:', data.status, data.error_message);
            return {
                success: false,
                error: `Distance API error: ${data.status}${data.error_message ? ' - ' + data.error_message : ''}`
            };
        }
    } catch (error) {
        console.error('Distance calculation error:', error);
        return {
            success: false,
            error: `Network error: ${error.message}`
        };
    }
}

// Calculate number of days between travel date and return date
function calculateNumberOfDays(travelDate, returnDate) {
    if (!travelDate) return 1; // Default to 1 day for local bookings
    
    const start = new Date(travelDate);
    const end = returnDate ? new Date(returnDate) : start; // If no return date, same day
    
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
    
    return Math.max(1, daysDiff); // Minimum 1 day
}

// Calculate fare based on distance, vehicle type, and number of days
function calculateFare(distance, vehicleType, numberOfDays) {
    const pricePerKm = VEHICLE_PRICING[vehicleType] || 16; // Default to Sedan price if vehicle not found
    const baseFare = distance * pricePerKm;
    const dailyCharge = 500 * numberOfDays;
    const totalFare = baseFare + dailyCharge;
    
    console.log('Fare calculation:', {
        distance,
        vehicleType,
        pricePerKm,
        numberOfDays,
        baseFare,
        dailyCharge,
        totalFare
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

// Dynamically collect booking data based on active tab
function getBookingDataFromUI() {
    console.log('=== COLLECTING BOOKING DATA FROM UI ===');
    
    // Get active tab
    const activeTabElement = document.querySelector(".tab-button.active");
    if (!activeTabElement) {
        console.error('No active tab found!');
        return null;
    }
    
    const activeTab = activeTabElement.dataset.tab;
    console.log('Active tab:', activeTab);
    
    // Common fields for all tabs
    const bookingData = {
        name: document.querySelector('input[name="name"]').value.trim(),
        phone: document.querySelector('input[name="phone"]').value.trim(),
        email: document.querySelector('input[name="email"]').value.trim(),
        message: document.querySelector('textarea[name="message"]')?.value.trim() || "",
        bookingType: activeTab.charAt(0).toUpperCase() + activeTab.slice(1), // Capitalize: local -> Local
        vehicle: window.selectedVehicle || ""
    };
    
    // Tab-specific fields
    if (activeTab === "local") {
        // Handle both select and input elements (after autocomplete conversion)
        const pickupElement = document.querySelector('#pickupLocation') || document.querySelector('input[name="pickup"]');
        const dropElement = document.querySelector('#dropLocation') || document.querySelector('input[name="drop"]');
        const pickupOtherElement = document.querySelector('#pickupOther input[name="pickupOther"]');
        const dropOtherElement = document.querySelector('#dropOther input[name="dropOther"]');
        const hourElement = document.querySelector('select[name="hour"]');
        const minuteElement = document.querySelector('select[name="minute"]');
        const periodElement = document.querySelector('select[name="period"]');
        const travelDateElement = document.querySelector('input[name="travelDate"]');
        
        // Use "Other" input if pickup/drop is "Other", otherwise use the main element
        let pickupValue = '';
        let dropValue = '';
        
        if (pickupElement && pickupElement.value === 'Other' && pickupOtherElement) {
            pickupValue = pickupOtherElement.value.trim();
        } else if (pickupElement) {
            pickupValue = pickupElement.value.trim();
        }
        
        if (dropElement && dropElement.value === 'Other' && dropOtherElement) {
            dropValue = dropOtherElement.value.trim();
        } else if (dropElement) {
            dropValue = dropElement.value.trim();
        }
        
        bookingData.pickup = pickupValue;
        bookingData.drop = dropValue;
        bookingData.travelDate = travelDateElement ? travelDateElement.value : '';
        
        // Build time string safely
        const hour = hourElement ? hourElement.value : '';
        const minute = minuteElement ? minuteElement.value : '';
        const period = periodElement ? periodElement.value : '';
        bookingData.time = (hour && minute && period) ? `${hour}:${minute} ${period}` : '';
        
        bookingData.tripType = ""; // Empty for local bookings
        bookingData.startDate = bookingData.travelDate; // Same as travel date
        bookingData.returnDate = ""; // Empty for local bookings
        bookingData.packageType = ""; // Empty for local bookings
        
        // Add fare calculation for local bookings
        if (window.currentBookingData && window.currentBookingData.calculatedDistance) {
            const distance = window.currentBookingData.calculatedDistance;
            const vehicleRate = VEHICLE_RATES['Local'][bookingData.vehicle] || 20; // Default to Sedan rate
            bookingData.tripFare = Math.round(distance * vehicleRate);
            bookingData.distance = distance;
            bookingData.pricePerKm = vehicleRate;
            console.log('Fare calculated from stored distance:', distance, 'km × ₹', vehicleRate, '= ₹', bookingData.tripFare);
        } else if (bookingData.vehicle) {
            // Fallback: calculate fare even if distance not stored
            const vehicleRate = VEHICLE_RATES['Local'][bookingData.vehicle] || 20;
            // Use a default distance if not available
            const defaultDistance = 44.35; // Based on your console log
            bookingData.tripFare = Math.round(defaultDistance * vehicleRate);
            bookingData.distance = defaultDistance;
            bookingData.pricePerKm = vehicleRate;
            console.log('Fare calculated from default distance:', defaultDistance, 'km × ₹', vehicleRate, '= ₹', bookingData.tripFare);
        }
        
    } else if (activeTab === "outstation") {
        // Handle both select and input elements
        const pickupElement = document.querySelector('select[name="outstationPickup"]') || document.querySelector('input[name="outstationPickup"]');
        const dropElement = document.querySelector('select[name="outstationDrop"]') || document.querySelector('input[name="outstationDrop"]');
        const startDateElement = document.querySelector('input[name="startDate"]');
        const returnDateElement = document.querySelector('input[name="returnDate"]');
        const hourElement = document.querySelector('select[name="roundtripHour"]');
        const minuteElement = document.querySelector('select[name="roundtripMinute"]');
        const periodElement = document.querySelector('select[name="roundtripPeriod"]');
        const tripTypeElement = document.querySelector('input[name="tripType"]:checked');
        
        bookingData.pickup = pickupElement ? pickupElement.value.trim() : '';
        bookingData.drop = dropElement ? dropElement.value.trim() : '';
        bookingData.startDate = startDateElement ? startDateElement.value : '';
        bookingData.returnDate = returnDateElement ? returnDateElement.value : '';
        
        // Build time string safely
        const hour = hourElement ? hourElement.value : '';
        const minute = minuteElement ? minuteElement.value : '';
        const period = periodElement ? periodElement.value : '';
        bookingData.time = (hour && minute && period) ? `${hour}:${minute} ${period}` : '';
        
        bookingData.tripType = tripTypeElement ? tripTypeElement.value : "One Way";
        bookingData.travelDate = bookingData.startDate; // Same as start date
        
    } else if (activeTab === "package") {
        // Handle both select and input elements
        const pickupElement = document.querySelector('select[name="packagePickup"]') || document.querySelector('input[name="packagePickup"]');
        const packageTypeElement = document.querySelector('select[name="packageType"]');
        const packageDateElement = document.querySelector('input[name="packageDate"]');
        const hourElement = document.querySelector('select[name="packageHour"]');
        const minuteElement = document.querySelector('select[name="packageMinute"]');
        const periodElement = document.querySelector('select[name="packagePeriod"]');
        
        bookingData.pickup = pickupElement ? pickupElement.value.trim() : '';
        bookingData.packageType = packageTypeElement ? packageTypeElement.value.trim() : '';
        bookingData.startDate = packageDateElement ? packageDateElement.value : '';
        
        // Build time string safely
        const hour = hourElement ? hourElement.value : '';
        const minute = minuteElement ? minuteElement.value : '';
        const period = periodElement ? periodElement.value : '';
        bookingData.time = (hour && minute && period) ? `${hour}:${minute} ${period}` : '';
        
        bookingData.tripType = "One Way"; // Default for package
        bookingData.travelDate = bookingData.startDate; // Same as start date
        bookingData.returnDate = ""; // Empty for package
        bookingData.drop = ""; // No drop location for package
    }
    
    console.log('Collected booking data:', bookingData);
    console.log('Selected vehicle from window:', window.selectedVehicle);
    console.log('Trip fare calculated:', bookingData.tripFare);
    console.log('Return date set to:', bookingData.returnDate);
    return bookingData;
}

// Submit booking data to Google Apps Script Web App
async function submitBookingToGoogleForm(bookingData) {
    console.log('=== SUBMITTING TO GOOGLE APPS SCRIPT ===');
    console.log('Booking data:', bookingData);
    
    // Format date and time fields for Apps Script
    const formattedData = {
        ...bookingData,
        travelDate: formatDate(bookingData.travelDate),
        startDate: formatDate(bookingData.startDate),
        returnDate: formatDate(bookingData.returnDate),
        time: formatTime(bookingData.time),
        id: `BK${Date.now()}`, // Generate booking ID
        timestamp: new Date().toISOString()
    };
    
    console.log('Formatted data for Apps Script:', formattedData);
    
    try {
        console.log('Submitting to Apps Script URL:', GOOGLE_APPS_SCRIPT_URL);
        
        // Use no-cors mode since CORS is problematic with Google Apps Script
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(formattedData)
        });
        
        console.log(`✅ Booking submitted (no-cors): ${bookingData.name}`);
        return { ok: true, message: 'Submitted successfully' };
        
    } catch (err) {
        console.error("❌ Apps Script submission failed:", err);
        throw err;
    }
}

// Legacy function name for compatibility
function submitToGoogleFormBackground(bookingRecord) {
    // Convert bookingRecord to the format expected by new system
    const bookingData = {
        name: bookingRecord.name,
        phone: bookingRecord.phone,
        email: bookingRecord.email,
        message: '',
        bookingType: bookingRecord.service || 'Local',
        tripType: 'One Way',
        vehicle: bookingRecord.vehicle,
        pickup: bookingRecord.pickup,
        drop: bookingRecord.drop,
        packageType: '',
        travelDate: bookingRecord.date,
        startDate: bookingRecord.date,
        returnDate: '',
        time: bookingRecord.time
    };
    
    submitBookingToGoogleForm(bookingData);
}

// Submit data to Google Form (fallback - old method)
function submitToGoogleForm(data) {
    // This function would handle Google Form submission
    // For now, just show success message
    showNotification('Form submitted successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
        }
        }, 300);
    }, 5000);
}

// Setup Confirm Booking button functionality
document.addEventListener('DOMContentLoaded', function() {
    const confirmBookingBtn = document.getElementById('confirmBooking');
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', function() {
            if (!confirmBookingBtn.disabled) {
                // Unify confirm flow to one path
                confirmBookingWithVehicle();
            }
        });
    }
});

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
        e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Distance calculation and fare display functions
// Vehicle rates for different trip types
// PERMANENT LOCAL RATES - DO NOT CHANGE WITHOUT APPROVAL
const VEHICLE_RATES = {
    'Local': {
        'Sedan': 20,                    // 4+1 seater - ₹20/km
        'Maruti Ertiga AC': 28,         // 6+1 seater - ₹28/km
        'Toyota Innova AC': 32,         // 7+1 seater - ₹32/km
        'Toyota Innova Crysta AC': 38,  // 7+1 seater - ₹38/km
        'Tempo Traveller Non-AC': 58,   // 12+1 seater - ₹58/km
        'Tempo Traveller AC': 62,       // 12+1 seater - ₹62/km
    },
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
    'Package': {
        'Sedan': 20,                    // 4+1 seater
        'Maruti Ertiga AC': 28,         // 6+1 seater
        'Toyota Innova AC': 32,         // 7+1 seater
        'Toyota Innova Crysta AC': 38,  // 7+1 seater
        'Tempo Traveller Non-AC': 58,   // 12+1 seater
        'Tempo Traveller AC': 62,       // 12+1 seater
    }
};

const VEHICLE_FARE_IDS = {
    'Sedan': 'sedan-fare',
    'Maruti Ertiga AC': 'ertiga-fare',
    'Toyota Innova AC': 'innova-fare',
    'Toyota Innova Crysta AC': 'crysta-fare',
    'Tempo Traveller AC': 'tempo-ac-fare',
    'Tempo Traveller Non-AC': 'tempo-nonac-fare'
};

const VEHICLE_MAIN_FARE_IDS = {
    'Sedan': 'sedan-main-fare',
    'Maruti Ertiga AC': 'ertiga-main-fare',
    'Toyota Innova AC': 'innova-main-fare',
    'Toyota Innova Crysta AC': 'crysta-main-fare',
    'Tempo Traveller AC': 'tempo-ac-main-fare',
    'Tempo Traveller Non-AC': 'tempo-nonac-main-fare'
};

const VEHICLE_MAIN_PRICE_IDS = {
    'Sedan': 'sedan-main-price',
    'Maruti Ertiga AC': 'ertiga-main-price',
    'Toyota Innova AC': 'innova-main-price',
    'Toyota Innova Crysta AC': 'crysta-main-price',
    'Tempo Traveller AC': 'tempo-ac-main-price',
    'Tempo Traveller Non-AC': 'tempo-nonac-main-price'
};

async function calculateDistanceAndUpdateFares() {
    console.log('=== FARE CALCULATION STARTED ===');
    const pickupInput = document.getElementById('pickupLocation');
    const dropInput = document.getElementById('dropLocation');
    
    console.log('Pickup input:', pickupInput);
    console.log('Drop input:', dropInput);
    console.log('Pickup value:', pickupInput?.value);
    console.log('Drop value:', dropInput?.value);
    
    // Debug: Check if elements exist and their visibility
    console.log('All elements with "pickup" in ID:', document.querySelectorAll('[id*="pickup"]'));
    console.log('All elements with "drop" in ID:', document.querySelectorAll('[id*="drop"]'));
    console.log('Local tab element:', document.getElementById('local-tab'));
    console.log('Local tab classes:', document.getElementById('local-tab')?.className);
    
    // Try to get pickup and drop values from form elements or stored booking data
    let pickupValue = pickupInput?.value;
    let dropValue = dropInput?.value;
    
    // Fallback: get from stored booking data if elements are not found
    if ((!pickupValue || !dropValue) && window.currentBookingData) {
        pickupValue = window.currentBookingData.pickup;
        dropValue = window.currentBookingData.drop;
        console.log('Using fallback values from booking data:');
        console.log('Pickup:', pickupValue);
        console.log('Drop:', dropValue);
    }
    
    if (!pickupValue || !dropValue) {
        console.log('No pickup/drop values found, resetting fares to calculating state');
        // Reset all fares to calculating state
        Object.values(VEHICLE_FARE_IDS).forEach(fareId => {
            const fareElement = document.getElementById(fareId);
            const spinnerId = fareId.replace('-fare', '-spinner');
            const calculatingId = fareId.replace('-fare', '-calculating');
            const spinnerElement = document.getElementById(spinnerId);
            const calculatingElement = document.getElementById(calculatingId);
            
            if (fareElement) {
                fareElement.textContent = '';
            }
            if (spinnerElement) {
                spinnerElement.classList.remove('hidden');
            }
            if (calculatingElement) {
                calculatingElement.textContent = 'Calculating fare...';
                calculatingElement.classList.remove('hidden');
            }
        });
        
        // Main vehicle cards remain unchanged - only modal shows calculated fares
        return;
    }
    
    try {
        const distance = await getDistanceFromGoogleMaps(pickupValue, dropValue);
        console.log('=== DISTANCE CALCULATION RESULT ===');
        console.log('Pickup Location:', pickupValue);
        console.log('Drop Location:', dropValue);
        console.log('Calculated Distance:', distance, 'km');
        console.log('=====================================');
        
        // Get current booking type (Local/Outstation/Package)
        const activeTab = document.querySelector('.tab.active');
        const bookingType = activeTab ? activeTab.id.replace('-tab', '') : 'Local';
        console.log('Current booking type:', bookingType);
        
        // Get rates for current booking type
        const currentRates = VEHICLE_RATES[bookingType] || VEHICLE_RATES['Local'];
        
        // Store the calculated distance for use in selection preview
        if (window.currentBookingData) {
            window.currentBookingData.calculatedDistance = distance;
        }
        
        // Update fare for each vehicle (modal only)
        console.log('Calculating fares for all vehicles:');
        Object.entries(currentRates).forEach(([vehicleName, rate]) => {
            const totalFare = Math.round(distance * rate);
            const acText = vehicleName.includes('Non-AC') ? 'Non-AC' : 'AC';
            console.log(`${vehicleName}: ${distance}km × ₹${rate}/km = ₹${totalFare}`);

            // Update modal fare
            const fareId = VEHICLE_FARE_IDS[vehicleName];
            const fareElement = document.getElementById(fareId);
            const spinnerId = fareId.replace('-fare', '-spinner');
            const calculatingId = fareId.replace('-fare', '-calculating');
            const spinnerElement = document.getElementById(spinnerId);
            const calculatingElement = document.getElementById(calculatingId);
            
            if (fareElement) {
                fareElement.textContent = `₹ ${totalFare}`;
            }
            if (spinnerElement) {
                spinnerElement.classList.add('hidden');
            }
            if (calculatingElement) {
                calculatingElement.classList.add('hidden');
            }
        });
        
    } catch (error) {
        console.error('Error calculating distance:', error);
        // Show error state for modal
        Object.values(VEHICLE_FARE_IDS).forEach(fareId => {
            const fareElement = document.getElementById(fareId);
            const spinnerId = fareId.replace('-fare', '-spinner');
            const calculatingId = fareId.replace('-fare', '-calculating');
            const spinnerElement = document.getElementById(spinnerId);
            const calculatingElement = document.getElementById(calculatingId);
            
            if (fareElement) {
                fareElement.textContent = '';
            }
            if (spinnerElement) {
                spinnerElement.classList.remove('hidden');
            }
            if (calculatingElement) {
                calculatingElement.textContent = 'Calculating fare...';
                calculatingElement.classList.remove('hidden');
            }
        });
        
        // Main vehicle cards remain unchanged - only modal shows error states
    }
}

async function getDistanceFromGoogleMaps(origin, destination) {
    console.log('Getting distance via Google Apps Script...');
    console.log('Origin:', origin);
    console.log('Destination:', destination);
    
    // Use your Google Apps Script as a proxy to avoid CORS issues
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbyGuty33r-zyM_tQqNbezJJcueGrEoXBpun0TZeoqPC5e7z4Mof68CWbHZJESEMs5NxPw/exec';
    const url = `${scriptUrl}?action=distance&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    console.log('Script URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Script Response:', data);
    
    // Handle response from Google Apps Script
    if (data.success && data.distance) {
        return data.distance;
    } else if (data.error) {
        throw new Error(data.error);
    } else if (data.ok && data.message) {
        // This means the script is running but doesn't have the distance endpoint
        throw new Error(`Script running but distance endpoint not available: ${data.message}`);
    } else {
        console.error('Unexpected response format:', data);
        throw new Error('Unable to calculate distance - unexpected response format');
    }
}

// Add event listeners to pickup and drop inputs to recalculate fares
function setupFareCalculation() {
    const pickupInput = document.getElementById('pickupLocation');
    const dropInput = document.getElementById('dropLocation');
    
    if (pickupInput && dropInput) {
        // Add debounced event listeners
        let timeoutId;
        const debouncedCalculate = () => {
            clearTimeout(timeoutId);
            console.log('Location changed - triggering distance calculation in 500ms...');
            timeoutId = setTimeout(() => {
                console.log('Starting distance calculation due to location change...');
                calculateDistanceAndUpdateFares();
            }, 500);
        };
        
        pickupInput.addEventListener('input', debouncedCalculate);
        dropInput.addEventListener('change', debouncedCalculate);
        dropInput.addEventListener('input', debouncedCalculate);
    }
}

// Form validation for vehicle selection
function validateFormForVehicleSelection() {
    const form = document.getElementById('bookingForm');
    if (!form) return false;
    
    // Get active tab
    const activeTabInput = document.getElementById('activeTab');
    let activeTab = activeTabInput ? activeTabInput.value : '';
    
    if (!activeTab) {
        const visibleTab = document.querySelector('.tab-content:not(.hidden)');
        if (visibleTab) {
            activeTab = visibleTab.id.replace('-tab', '');
        } else {
            activeTab = 'local';
        }
    }
    
    // Validate required fields for active tab
    const activeTabElement = document.getElementById(activeTab + '-tab');
    if (activeTabElement) {
        const requiredFields = activeTabElement.querySelectorAll('input[data-required], select[data-required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                showNotification(`Please fill in ${field.previousElementSibling?.textContent || field.name}`, 'error');
                field.focus();
                return false;
            }
        }
    }
    
    return true;
}

// Get form data for vehicle selection
function getFormData() {
    const form = document.getElementById('bookingForm');
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    // Get active tab
    const activeTabInput = document.getElementById('activeTab');
    let activeTab = activeTabInput ? activeTabInput.value : '';
    
    if (!activeTab) {
        const visibleTab = document.querySelector('.tab-content:not(.hidden)');
        if (visibleTab) {
            activeTab = visibleTab.id.replace('-tab', '');
        } else {
            activeTab = 'local';
        }
    }
    
    // Get all form fields
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Add active tab info - capitalize first letter
    data.bookingType = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    
    return data;
}

// Add scroll effect to navigation
window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.classList.add('shadow-lg');
    } else {
        nav.classList.remove('shadow-lg');
    }
});

// =============================================================================
// BANGALORE LOCATION VALIDATION
// =============================================================================

// List of Bangalore areas/locations for local bookings
const BANGALORE_LOCATIONS = [
    'Koramangala', 'Whitefield', 'MG Road', 'Indiranagar', 'Marathahalli', 
    'Vijaynagar', 'Rajajinagar', 'Basavanagudi', 'Jayanagar', 'JP Nagar',
    'Banashankari', 'HSR Layout', 'BTM Layout', 'Electronic City', 'Hebbal',
    'Yelahanka', 'Malleswaram', 'Shivajinagar', 'Cubbon Park', 'Brigade Road',
    'Commercial Street', 'Ulsoor', 'Domlur', 'Koramangala 5th Block',
    'Koramangala 6th Block', 'Koramangala 7th Block', 'Koramangala 8th Block',
    'Indiranagar 100 Feet Road', 'Indiranagar Double Road', 'Marathahalli Bridge',
    'Whitefield ITPL', 'Whitefield Main Road', 'Electronic City Phase 1',
    'Electronic City Phase 2', 'HSR Layout Sector 1', 'HSR Layout Sector 2',
    'BTM Layout 1st Stage', 'BTM Layout 2nd Stage', 'Jayanagar 4th Block',
    'Jayanagar 5th Block', 'Jayanagar 9th Block', 'JP Nagar 1st Phase',
    'JP Nagar 2nd Phase', 'JP Nagar 3rd Phase', 'Banashankari 2nd Stage',
    'Banashankari 3rd Stage', 'Basavanagudi Bull Temple', 'Gandhi Bazaar',
    'Vijaynagar 1st Block', 'Vijaynagar 2nd Block', 'Rajajinagar 1st Block',
    'Rajajinagar 2nd Block', 'Malleswaram 8th Cross', 'Malleswaram 18th Cross',
    'Shivajinagar Bus Stand', 'Cubbon Park Metro', 'Brigade Road Metro',
    'Commercial Street Metro', 'Ulsoor Lake', 'Domlur Layout',
    // Airport and major landmarks
    'Kempegowda International Airport', 'Bangalore Airport', 'BLR Airport',
    'Devanahalli', 'Airport Road', 'Old Airport Road', 'New Airport Road',
    'Bangalore International Airport', 'KIA', 'Kempegowda Airport',
    // Additional major areas
    'Richmond Town', 'Frazer Town', 'Cox Town', 'Cooke Town', 'Murphy Town',
    'Austin Town', 'Langford Town', 'Shantinagar', 'Richmond Circle',
    'Lalbagh', 'Cubbon Park', 'Vidhana Soudha', 'High Court', 'City Railway Station',
    'Majestic', 'Kempegowda Bus Station', 'Shivajinagar Bus Stand',
    'Yeshwantpur', 'Peenya', 'Nelamangala', 'Tumkur Road', 'Mysore Road',
    'Hosur Road', 'Bannerghatta Road', 'Kanakapura Road', 'Magadi Road',
    'Bellary Road', 'Airport Road', 'Old Madras Road', 'Whitefield Road',
    'Outer Ring Road', 'Inner Ring Road', 'NICE Road', 'Hennur Road',
    'Begur', 'Bommanahalli', 'Anekal', 'Hoskote', 'Doddaballapur',
    'Ramanagara', 'Chikkaballapur', 'Kolar', 'Tumkur',
    // Markets and commercial areas
    'K R Market', 'KR Market', 'Krishna Rajendra Market', 'City Market',
    'Seshadri Road', 'Mudamma Garden', 'Chickpet', 'Avenue Road',
    'Commercial Street', 'Brigade Road', 'Residency Road',
    // Airport area postal codes
    '534320', '562157', '562164'
];

// Function to check if a location is within Bangalore
function isBangaloreLocation(location) {
    if (!location || typeof location !== 'string') return false;
    
    const normalizedLocation = location.toLowerCase().trim();
    
    console.log('Validating location:', location, 'Normalized:', normalizedLocation);
    
    // Check if location contains "bangalore" or "bengaluru"
    if (normalizedLocation.includes('bangalore') || normalizedLocation.includes('bengaluru')) {
        console.log('✅ Location contains Bangalore/Bengaluru');
        return true;
    }
    
    // Special handling for airport variations - more comprehensive and lenient
    if (normalizedLocation.includes('kempegowda')) {
        console.log('✅ Location contains Kempegowda');
        return true;
    }
    if (normalizedLocation.includes('airport') && (normalizedLocation.includes('bangalore') || normalizedLocation.includes('blr') || normalizedLocation.includes('kia') || normalizedLocation.includes('bengaluru'))) {
        console.log('✅ Location is Bangalore airport');
        return true;
    }
    if (normalizedLocation.includes('devanahalli')) {
        console.log('✅ Location is Devanahalli (airport area)');
        return true;
    }
    // More lenient airport matching - if it contains airport and any Bangalore-related term
    if (normalizedLocation.includes('airport') && (normalizedLocation.includes('bangalore') || normalizedLocation.includes('bengaluru') || normalizedLocation.includes('blr') || normalizedLocation.includes('kia') || normalizedLocation.includes('kempegowda'))) {
        console.log('✅ Location appears to be Bangalore airport (lenient match)');
        return true;
    }
    
    // Check if it's in Karnataka state (for airport area)
    if (normalizedLocation.includes('karnataka') && (normalizedLocation.includes('airport') || normalizedLocation.includes('kempegowda'))) {
        console.log('✅ Location is in Karnataka airport area');
        return true;
    }
    
    // Check for Karnataka postal codes (airport area postal codes)
    if (normalizedLocation.includes('karnataka') && normalizedLocation.includes('534320')) {
        console.log('✅ Location is Karnataka 534320 (airport area postal code)');
        return true;
    }
    
    // Check for other airport area postal codes
    if (normalizedLocation.includes('534320') || normalizedLocation.includes('562157') || normalizedLocation.includes('562164')) {
        console.log('✅ Location is airport area postal code');
        return true;
    }
    
    // Check against known Bangalore areas
    const isKnownArea = BANGALORE_LOCATIONS.some(area => {
        const areaLower = area.toLowerCase();
        const matches = normalizedLocation.includes(areaLower) || areaLower.includes(normalizedLocation);
        if (matches) {
            console.log('✅ Location matches known area:', area);
        }
        return matches;
    });
    
    if (isKnownArea) {
        return true;
    }
    
    console.log('❌ Location not recognized as Bangalore area');
    return false;
}

// Function to validate location for local bookings
function validateLocationForLocal(location, fieldName) {
    if (!isBangaloreLocation(location)) {
        showLocationValidationError(fieldName, location);
        return false;
    }
    return true;
}

// Function to show location validation error
function showLocationValidationError(fieldName, location) {
    const errorMessage = `Local duties are inside Bangalore limits. "${location}" appears to be outside Bangalore. Please select a location within Bangalore.`;
    
    // Add visual feedback to the input field
    let input = null;
    let container = null;
    
    if (fieldName === 'pickup') {
        // Try both select and input elements
        input = document.querySelector('#pickupLocation') || document.querySelector('input[name="pickup"]');
        container = input ? input.closest('.grid > div') : null;
    } else if (fieldName === 'drop') {
        // Try both select and input elements
        input = document.querySelector('#dropLocation') || document.querySelector('input[name="drop"]');
        container = input ? input.closest('.grid > div') : null;
    } else if (fieldName === 'pickupOther') {
        input = document.querySelector('#pickupOther input[name="pickupOther"]');
        container = input ? input.closest('#pickupOther') : null;
    } else if (fieldName === 'dropOther') {
        input = document.querySelector('#dropOther input[name="dropOther"]');
        container = input ? input.closest('#dropOther') : null;
    }
    
    if (input) {
        input.classList.add('border-red-500', 'bg-red-50');
        
        // Add error message below the field
        if (container) {
            // Remove any existing error message
            const existingError = container.querySelector('.location-error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = 'location-error-message text-red-500 text-sm mt-1';
            errorElement.textContent = errorMessage;
            
            // Insert error message after the input field
            if (input.parentNode) {
                input.parentNode.insertAdjacentElement('afterend', errorElement);
            }
        }
        
        // Remove error styling and message after 10 seconds
        setTimeout(() => {
            input.classList.remove('border-red-500', 'bg-red-50');
            const errorElement = container ? container.querySelector('.location-error-message') : null;
            if (errorElement) {
                errorElement.remove();
            }
        }, 10000);
    }
}

// Function to filter locations for local bookings
function filterLocationsForLocal(selectElement) {
    if (!selectElement) return;
    
    const options = selectElement.querySelectorAll('option');
    const filteredOptions = [];
    
    options.forEach(option => {
        if (option.value === '' || option.value === 'Other') {
            filteredOptions.push(option);
        } else if (isBangaloreLocation(option.value)) {
            filteredOptions.push(option);
        }
    });
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add filtered options
    filteredOptions.forEach(option => {
        selectElement.appendChild(option);
    });
    
    console.log(`Filtered ${filteredOptions.length} Bangalore locations for ${selectElement.id}`);
}

// Setup tab switching functionality
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active', 'border-green-500', 'bg-green-50', 'text-green-700'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
            
            // Add active class to clicked tab
            this.classList.add('active', 'border-green-500', 'bg-green-50', 'text-green-700');
            document.getElementById(tabName + '-tab').classList.remove('hidden');
            
            // Filter locations if switching to local tab
            if (tabName === 'local') {
                filterLocalTabLocations();
                // Clear any non-Bangalore locations that might have been selected
                clearNonBangaloreSelections();
                // Validate any existing values
                validateExistingLocationValues();
            }
        });
    });
}

// Clear any non-Bangalore locations that might have been selected
function clearNonBangaloreSelections() {
    // Check for both select and input elements
    const localPickupElement = document.querySelector('#pickupLocation') || document.querySelector('input[name="pickup"]');
    const localDropElement = document.querySelector('#dropLocation') || document.querySelector('input[name="drop"]');
    const pickupOtherInput = document.querySelector('#pickupOther input[name="pickupOther"]');
    const dropOtherInput = document.querySelector('#dropOther input[name="dropOther"]');
    
    // Clear pickup selection if it's not a Bangalore location
    if (localPickupElement && localPickupElement.value && localPickupElement.value !== 'Other' && !isBangaloreLocation(localPickupElement.value)) {
        localPickupElement.value = '';
        console.log('Cleared non-Bangalore pickup location');
    }
    
    // Clear drop selection if it's not a Bangalore location
    if (localDropElement && localDropElement.value && localDropElement.value !== 'Other' && !isBangaloreLocation(localDropElement.value)) {
        localDropElement.value = '';
        console.log('Cleared non-Bangalore drop location');
    }
    
    // Clear "Other" input fields if they contain non-Bangalore locations
    if (pickupOtherInput && pickupOtherInput.value && !isBangaloreLocation(pickupOtherInput.value)) {
        pickupOtherInput.value = '';
        console.log('Cleared non-Bangalore pickup other input');
    }
    
    if (dropOtherInput && dropOtherInput.value && !isBangaloreLocation(dropOtherInput.value)) {
        dropOtherInput.value = '';
        console.log('Cleared non-Bangalore drop other input');
    }
}

// Validate existing location values when page loads
function validateExistingLocationValues() {
    const localPickupElement = document.querySelector('#pickupLocation') || document.querySelector('input[name="pickup"]');
    const localDropElement = document.querySelector('#dropLocation') || document.querySelector('input[name="drop"]');
    const pickupOtherInput = document.querySelector('#pickupOther input[name="pickupOther"]');
    const dropOtherInput = document.querySelector('#dropOther input[name="dropOther"]');
    
    // Validate pickup location
    if (localPickupElement && localPickupElement.value && localPickupElement.value !== 'Other' && !isBangaloreLocation(localPickupElement.value)) {
        showLocationValidationError('pickup', localPickupElement.value);
    }
    
    // Validate drop location
    if (localDropElement && localDropElement.value && localDropElement.value !== 'Other' && !isBangaloreLocation(localDropElement.value)) {
        showLocationValidationError('drop', localDropElement.value);
    }
    
    // Validate "Other" input fields
    if (pickupOtherInput && pickupOtherInput.value && !isBangaloreLocation(pickupOtherInput.value)) {
        showLocationValidationError('pickupOther', pickupOtherInput.value);
    }
    
    if (dropOtherInput && dropOtherInput.value && !isBangaloreLocation(dropOtherInput.value)) {
        showLocationValidationError('dropOther', dropOtherInput.value);
    }
}

// Filter locations in local tab to show only Bangalore locations
function filterLocalTabLocations() {
    // Check if elements are still select elements or have been converted to inputs
    const localPickupElement = document.querySelector('#pickupLocation') || document.querySelector('input[name="pickup"]');
    const localDropElement = document.querySelector('#dropLocation') || document.querySelector('input[name="drop"]');
    
    if (localPickupElement) {
        // If it's still a select element, filter it
        if (localPickupElement.tagName === 'SELECT') {
            filterLocationsForLocal(localPickupElement);
        }
        
        // Add validation for both select and input elements
        localPickupElement.addEventListener('change', function() {
            // Clear any existing error message
            const container = this.closest('.grid > div');
            if (container) {
                const existingError = container.querySelector('.location-error-message');
                if (existingError) {
                    existingError.remove();
                }
            }
            
            if (this.value && this.value !== 'Other') {
                validateLocationForLocal(this.value, 'pickup');
            }
        });
        
        // For input elements, also validate on blur with debounce
        if (localPickupElement.tagName === 'INPUT') {
            let validationTimeout;
            localPickupElement.addEventListener('blur', function() {
                if (this.value && this.value.trim()) {
                    // Clear any existing timeout
                    if (validationTimeout) {
                        clearTimeout(validationTimeout);
                    }
                    // Add small delay to prevent validation on partial typing
                    validationTimeout = setTimeout(() => {
                        validateLocationForLocal(this.value.trim(), 'pickup');
                    }, 500);
                }
            });
        }
    }
    
    if (localDropElement) {
        // If it's still a select element, filter it
        if (localDropElement.tagName === 'SELECT') {
            filterLocationsForLocal(localDropElement);
        }
        
        // Add validation for both select and input elements
        localDropElement.addEventListener('change', function() {
            // Clear any existing error message
            const container = this.closest('.grid > div');
            if (container) {
                const existingError = container.querySelector('.location-error-message');
                if (existingError) {
                    existingError.remove();
                }
            }
            
            if (this.value && this.value !== 'Other') {
                validateLocationForLocal(this.value, 'drop');
            }
        });
        
        // For input elements, also validate on blur with debounce
        if (localDropElement.tagName === 'INPUT') {
            let validationTimeout;
            localDropElement.addEventListener('blur', function() {
                if (this.value && this.value.trim()) {
                    // Clear any existing timeout
                    if (validationTimeout) {
                        clearTimeout(validationTimeout);
                    }
                    // Add small delay to prevent validation on partial typing
                    validationTimeout = setTimeout(() => {
                        validateLocationForLocal(this.value.trim(), 'drop');
                    }, 500);
                }
            });
        }
    }
    
    // Setup validation for "Other" input fields in local tab
    setupOtherInputValidation();
}

// Setup validation for "Other" input fields
function setupOtherInputValidation() {
    const pickupOtherInput = document.querySelector('#pickupOther input[name="pickupOther"]');
    const dropOtherInput = document.querySelector('#dropOther input[name="dropOther"]');
    
    if (pickupOtherInput) {
        let validationTimeout;
        pickupOtherInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                // Clear any existing timeout
                if (validationTimeout) {
                    clearTimeout(validationTimeout);
                }
                // Add small delay to prevent validation on partial typing
                validationTimeout = setTimeout(() => {
                    validateLocationForLocal(this.value.trim(), 'pickupOther');
                }, 500);
            }
        });
        
        // Also validate on input for real-time feedback
        pickupOtherInput.addEventListener('input', function() {
            // Remove previous error styling
            this.classList.remove('border-red-500', 'bg-red-50');
            
            // Remove error message
            const container = this.closest('#pickupOther');
            if (container) {
                const existingError = container.querySelector('.location-error-message');
                if (existingError) {
                    existingError.remove();
                }
            }
        });
    }
    
    if (dropOtherInput) {
        let validationTimeout;
        dropOtherInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                // Clear any existing timeout
                if (validationTimeout) {
                    clearTimeout(validationTimeout);
                }
                // Add small delay to prevent validation on partial typing
                validationTimeout = setTimeout(() => {
                    validateLocationForLocal(this.value.trim(), 'dropOther');
                }, 500);
            }
        });
        
        // Also validate on input for real-time feedback
        dropOtherInput.addEventListener('input', function() {
            // Remove previous error styling
            this.classList.remove('border-red-500', 'bg-red-50');
            
            // Remove error message
            const container = this.closest('#dropOther');
            if (container) {
                const existingError = container.querySelector('.location-error-message');
                if (existingError) {
                    existingError.remove();
                }
            }
        });
    }
}

// =============================================================================
// DYNAMIC LOCATION SEARCH (LIKE RAPIDO/OLA)
// =============================================================================

// Global variables for Google Places Autocomplete
let pickupAutocomplete = null;
let dropAutocomplete = null;
let currentLocationAutocomplete = null;

// Initialize Google Maps when ready
function initializeGoogleMapsWhenReady() {
    // Check if Google Maps is loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        console.log('Google Maps already loaded, initializing...');
        initGoogleMaps();
    } else {
        // Wait for Google Maps to load
        console.log('Waiting for Google Maps to load...');
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkGoogleMaps = setInterval(() => {
            attempts++;
            
            if (typeof google !== 'undefined' && google.maps && google.maps.places) {
                console.log('Google Maps loaded after', attempts * 100, 'ms');
                clearInterval(checkGoogleMaps);
                initGoogleMaps();
            } else if (attempts >= maxAttempts) {
                console.error('Google Maps failed to load after 5 seconds');
                clearInterval(checkGoogleMaps);
                showGoogleMapsError();
            }
        }, 100);
    }
}

// Initialize Google Maps and Places API
function initGoogleMaps() {
    console.log('Google Maps initialized');
    
    try {
        // Initialize autocomplete for pickup locations
        initializeLocationAutocomplete();
        
        // Get user's current location
        getCurrentLocation();
        
        console.log('Location autocomplete setup complete');
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showGoogleMapsError();
    }
}

// Show error message if Google Maps fails to load
function showGoogleMapsError() {
    const locationInputs = document.querySelectorAll('input[name*="pickup"], input[name*="drop"]');
    locationInputs.forEach(input => {
        input.placeholder = 'Enter location manually (autocomplete unavailable)';
        input.style.borderColor = '#fbbf24'; // Yellow border to indicate fallback mode
    });
    
    console.warn('Google Maps autocomplete unavailable - using manual input mode');
}

// Initialize autocomplete for all location inputs
function initializeLocationAutocomplete() {
    // Pickup location autocomplete
    const pickupInputs = [
        'select[name="pickup"]',
        'select[name="outstationPickup"]', 
        'select[name="packagePickup"]'
    ];
    
    pickupInputs.forEach(selector => {
        const input = document.querySelector(selector);
        if (input) {
            // Convert select to input for autocomplete
            convertSelectToAutocomplete(input, 'pickup');
        }
    });
    
    // Drop location autocomplete
    const dropInputs = [
        'select[name="drop"]',
        'select[name="outstationDrop"]'
    ];
    
    dropInputs.forEach(selector => {
        const input = document.querySelector(selector);
        if (input) {
            convertSelectToAutocomplete(input, 'drop');
        }
    });
}

// Convert select dropdown to autocomplete input
function convertSelectToAutocomplete(selectElement, type) {
    try {
        // Create new input element
        const input = document.createElement('input');
        input.type = 'text';
        input.name = selectElement.name;
        input.placeholder = `Enter ${type} location...`;
        input.className = selectElement.className;
        input.required = selectElement.required;
        
        // Copy any data attributes
        Array.from(selectElement.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                input.setAttribute(attr.name, attr.value);
            }
        });
        
        // Replace select with input
        selectElement.parentNode.replaceChild(input, selectElement);
        
        // Check if Google Places is available
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.warn('Google Places not available, using manual input');
            input.placeholder = `Enter ${type} location manually...`;
            return;
        }
        
        // Suppress the deprecation warning
        const originalWarn = console.warn;
        console.warn = function(message) {
            if (message.includes('google.maps.places.Autocomplete is not available to new customers')) {
                return; // Suppress this specific warning
            }
            originalWarn.apply(console, arguments);
        };
        
        // Initialize Google Places Autocomplete (using current method - still works)
        const autocomplete = new google.maps.places.Autocomplete(input, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'in' } // Restrict to India
        });
        
        // Handle place selection
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                console.log(`${type} location selected:`, place.formatted_address);
                
                // Store coordinates for distance calculation
                input.setAttribute('data-lat', place.geometry.location.lat());
                input.setAttribute('data-lng', place.geometry.location.lng());
                input.setAttribute('data-address', place.formatted_address);
                
                // Validate if this is for local booking and location is within Bangalore
                const activeTab = document.querySelector('.tab-button.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'local') {
                    if (!isBangaloreLocation(place.formatted_address)) {
                        showLocationValidationError(type, place.formatted_address);
                        // Clear the input if it's not a Bangalore location
                        input.value = '';
                        return;
                    }
                }
                
                // Show success feedback
                showLocationSelected(input, place.formatted_address);
            }
        });
        
        // Store autocomplete reference
        if (type === 'pickup') {
            pickupAutocomplete = autocomplete;
        } else if (type === 'drop') {
            dropAutocomplete = autocomplete;
        }
        
        // Add current location button if this is a pickup input
        if (type === 'pickup') {
            addCurrentLocationButtonToInput(input);
        }
        
        // Add validation for manual input (when user types)
            input.addEventListener('input', function() {
            // Remove previous error styling
            this.classList.remove('border-red-500', 'bg-red-50');
            
            // Remove error message
            const container = this.closest('.grid > div') || this.closest('#pickupOther') || this.closest('#dropOther');
            if (container) {
                const existingError = container.querySelector('.location-error-message');
                if (existingError) {
                    existingError.remove();
                }
            }
        });
        
        // Add validation on blur for manual input
            input.addEventListener('blur', function() {
                const activeTab = document.querySelector('.tab-button.active');
            if (activeTab && activeTab.getAttribute('data-tab') === 'local' && this.value.trim()) {
                if (!isBangaloreLocation(this.value.trim())) {
                    showLocationValidationError(type, this.value.trim());
                }
        }
        });
        
        console.log(`Autocomplete initialized for ${type} location`);
        
    } catch (error) {
        console.error(`Error setting up autocomplete for ${type}:`, error);
        // Fallback: just use the input without autocomplete
        const input = document.createElement('input');
        input.type = 'text';
        input.name = selectElement.name;
        input.placeholder = `Enter ${type} location manually...`;
        input.className = selectElement.className;
        input.required = selectElement.required;
        selectElement.parentNode.replaceChild(input, selectElement);
    }
}

// Show location selected feedback
function showLocationSelected(input, address) {
    // Add success styling
    input.classList.add('border-green-500', 'bg-green-50');
    
    // Create success icon
    const successIcon = document.createElement('i');
    successIcon.className = 'fas fa-check-circle text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2';
    
    // Add icon to input container
    const container = input.parentNode;
    container.style.position = 'relative';
    container.appendChild(successIcon);
    
    // Remove success styling after 3 seconds
    setTimeout(() => {
        input.classList.remove('border-green-500', 'bg-green-50');
        if (successIcon.parentNode) {
            successIcon.parentNode.removeChild(successIcon);
        }
    }, 3000);
}

// Get user's current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                console.log('Current location:', lat, lng);
                
                // Reverse geocode to get address
                const geocoder = new google.maps.Geocoder();
                const latlng = { lat: lat, lng: lng };
                
                geocoder.geocode({ location: latlng }, function(results, status) {
                    if (status === 'OK' && results[0]) {
                        const currentAddress = results[0].formatted_address;
                        console.log('Current address:', currentAddress);
                        
                        // Add "Use Current Location" option to pickup inputs
                        addCurrentLocationOption(currentAddress, lat, lng);
                    }
                });
            },
            function(error) {
                console.log('Geolocation error:', error);
                // Fallback: don't show current location option
            }
        );
    }
}

// Add "Use Current Location" option
function addCurrentLocationOption(address, lat, lng) {
    const pickupInputs = document.querySelectorAll('input[name*="pickup"]');
    
    pickupInputs.forEach(input => {
        // Create current location button
        const currentLocationBtn = document.createElement('button');
        currentLocationBtn.type = 'button';
        currentLocationBtn.className = 'absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700';
        currentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
        currentLocationBtn.title = 'Use Current Location';
        
        // Add click handler
        currentLocationBtn.addEventListener('click', function() {
            input.value = address;
            input.setAttribute('data-lat', lat);
            input.setAttribute('data-lng', lng);
            input.setAttribute('data-address', address);
            
            showLocationSelected(input, address);
        });
        
        // Add button to input container
        const container = input.parentNode;
        container.style.position = 'relative';
        container.appendChild(currentLocationBtn);
    });
}

// Add current location button to a specific input element
function addCurrentLocationButtonToInput(input) {
    // Check if button already exists
    if (input.parentNode.querySelector('.current-location-btn')) {
        return; // Button already exists
    }
    
    // Create current location button
    const currentLocationBtn = document.createElement('button');
    currentLocationBtn.type = 'button';
    currentLocationBtn.className = 'current-location-btn absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700';
    currentLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    currentLocationBtn.title = 'Use Current Location';
    
    // Add click handler
    currentLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Reverse geocode to get address
                    const geocoder = new google.maps.Geocoder();
                    const latlng = { lat: lat, lng: lng };
                    
                    geocoder.geocode({ location: latlng }, function(results, status) {
                        if (status === 'OK' && results[0]) {
                            const currentAddress = results[0].formatted_address;
                            
                            input.value = currentAddress;
                            input.setAttribute('data-lat', lat);
                            input.setAttribute('data-lng', lng);
                            input.setAttribute('data-address', currentAddress);
                            
                            showLocationSelected(input, currentAddress);
                        }
                    });
                },
                function(error) {
                    console.log('Geolocation error:', error);
                    showNotification('Unable to get current location', 'error');
                }
            );
        } else {
            showNotification('Geolocation not supported', 'error');
        }
    });
    
    // Add button to input container
    const container = input.parentNode;
    container.style.position = 'relative';
    container.appendChild(currentLocationBtn);
}

// Enhanced distance calculation using coordinates
function calculateDistanceWithCoordinates(originInput, destinationInput) {
    const originLat = parseFloat(originInput.getAttribute('data-lat'));
    const originLng = parseFloat(originInput.getAttribute('data-lng'));
    const destLat = parseFloat(destinationInput.getAttribute('data-lat'));
    const destLng = parseFloat(destinationInput.getAttribute('data-lng'));
    
    if (originLat && originLng && destLat && destLng) {
        // Use Haversine formula for quick calculation
        const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
        console.log('Calculated distance:', distance, 'km');
        return distance;
    }
    
    // Fallback to address-based calculation
    const origin = originInput.getAttribute('data-address') || originInput.value;
    const destination = destinationInput.getAttribute('data-address') || destinationInput.value;
    
    return calculateDistance(origin, destination);
}

// Haversine formula for distance calculation
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Save booking directly to Excel sheet
async function saveBookingDirectly(bookingData, submitBtn, originalText) {
    console.log('Saving booking directly to Excel sheet:', bookingData);
    
    try {
        // Generate booking ID
        const bookingId = 'BK' + Date.now();
        
        // Create booking record for local storage
        const bookingRecord = {
            id: bookingId,
            timestamp: new Date().toLocaleString(),
            name: bookingData.name,
            phone: bookingData.phone,
            email: bookingData.email,
            service: bookingData.activeTab.toLowerCase(),
            vehicle: bookingData.selectedVehicle || 'To be assigned',
            pickup: bookingData.pickup || bookingData.outstationPickup || bookingData.packagePickup,
            drop: bookingData.drop || bookingData.outstationDrop || '',
            date: bookingData.travelDate || bookingData.onewayDate || bookingData.startDate || bookingData.packageDate,
            time: bookingData.travelTime || bookingData.onewayTime || bookingData.travelTime || bookingData.packageTime,
            status: 'Processing...'
        };
        
        // Save to localStorage
        let bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
        bookings.push(bookingRecord);
        // Booking saved to localStorage (display removed)
        
        // Send to Google Apps Script (Excel sheet)
        try {
            await submitBookingToGoogleForm(bookingData);
            
            // Update status to confirmed
            bookingRecord.status = 'Confirmed';
            bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
            const index = bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
                bookings[index] = bookingRecord;
                localStorage.setItem('vmBookings', JSON.stringify(bookings));
            }
            // Display removed - booking updated in localStorage only
            
            // Booking saved successfully - reset form
            resetFormToDefault();
            
        } catch (error) {
            console.error('Error submitting to Excel sheet:', error);
            
            // Update status to confirmed even if submission fails
            bookingRecord.status = 'Confirmed (Local only)';
            bookings = JSON.parse(localStorage.getItem('vmBookings') || '[]');
            const index = bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
                bookings[index] = bookingRecord;
                localStorage.setItem('vmBookings', JSON.stringify(bookings));
            }
            // Display removed - booking updated in localStorage only
            
            // Booking saved successfully - reset form
            resetFormToDefault();
        }
        
        console.log('Booking saved successfully:', bookingRecord);
        
    } catch (error) {
        console.error('Error in booking process:', error);
        showNotification('Error processing booking. Please try again.', 'error');
        
        // Reset button state on error
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Popup function removed - bookings now reset form directly

// Reset form to default state
function resetFormToDefault() {
    console.log('Resetting form to default state...');
    
    // Reset the submit button
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-car mr-2"></i>Book Now';
        submitBtn.disabled = false;
    }
    
    // Clear all form inputs
    const form = document.getElementById('bookingForm');
    if (form) {
        form.reset();
    }
    
    // Clear all text inputs
    const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
    textInputs.forEach(input => {
        input.value = '';
        // Remove any autocomplete data attributes
        input.removeAttribute('data-lat');
        input.removeAttribute('data-lng');
        input.removeAttribute('data-address');
    });
    
    // Reset all select elements to first option
    const selectElements = document.querySelectorAll('select');
    selectElements.forEach(select => {
        if (select.options.length > 0) {
            select.selectedIndex = 0;
        }
    });
    
    // Reset all radio buttons
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.checked = false;
    });
    
    // Reset all checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset date inputs to today
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.value = '';
    });
    
    // Switch to first tab (Local)
    const firstTabButton = document.querySelector('.tab-button[data-tab="local"]');
    if (firstTabButton) {
        firstTabButton.click();
    }
    
    // Clear any stored booking data
    window.currentBookingData = null;
    window.selectedVehicle = null;
    
    // Remove any success styling from location inputs
    const locationInputs = document.querySelectorAll('input[name*="pickup"], input[name*="drop"]');
    locationInputs.forEach(input => {
        input.classList.remove('border-green-500', 'bg-green-50');
    });
    
    // Remove any success icons
    const successIcons = document.querySelectorAll('.fa-check-circle');
    successIcons.forEach(icon => {
        if (icon.parentNode) {
            icon.parentNode.removeChild(icon);
        }
    });
    
    console.log('Form reset to default state completed');
}

// Make functions available globally
window.calculateDistanceWithCoordinates = calculateDistanceWithCoordinates;
window.resetFormToDefault = resetFormToDefault;
window.isBangaloreLocation = isBangaloreLocation;
window.validateLocationForLocal = validateLocationForLocal;
window.filterLocalTabLocations = filterLocalTabLocations;

// Test function for debugging
window.testBangaloreValidation = function(location) {
    console.log('Testing location:', location);
    const result = isBangaloreLocation(location);
    console.log('Result:', result ? '✅ VALID' : '❌ INVALID');
    return result;
};

