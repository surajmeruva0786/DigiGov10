// Global Variables
let currentUser = null;
let currentOfficial = null;
let isVoiceAssistantEnabled = false;
let isListening = false;
let currentLanguage = 'en'; // 'en' for English, 'hi' for Hindi
let complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
let users = JSON.parse(localStorage.getItem('users') || '[]');
let officials = JSON.parse(localStorage.getItem('officials') || '[]');
let schemes = [];
let userDocuments = JSON.parse(localStorage.getItem('userDocuments') || '[]');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize language from localStorage or default to English
    currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
    updateLanguage();
    
    // Show loading screen for 2 seconds, then show home screen in same place
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        const homeScreen = document.getElementById('home-screen');
        
        // Hide loading screen and show home screen
        loadingScreen.classList.remove('active');
        homeScreen.classList.add('active');
        
        // Scroll to top to ensure home screen is visible
        window.scrollTo(0, 0);
    }, 2000);
    
    // Load sample schemes data
    loadSchemes();
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
    
    // Initialize complaint status with sample data
    initializeSampleData();
}

// Navigation Functions
function navigateTo(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // Show target screen
    const targetScreen = document.getElementById(screenId + '-screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        // Speak navigation if voice assistant is enabled
        if (isVoiceAssistantEnabled) {
            const screenTitles = {
                'home': { en: 'Home', hi: 'मुख्य पृष्ठ' },
                'user-entry': { en: 'User Entry', hi: 'नागरिक प्रवेश' },
                'user-home': { en: 'User Home', hi: 'नागरिक होम' },
                'schemes': { en: 'Government Schemes', hi: 'सरकारी योजनाएं' },
                'complaints': { en: 'Complaints', hi: 'शिकायत' },
                'children': { en: 'Children Hub', hi: 'बच्चों का केंद्र' },
                'bills': { en: 'Bill Payments', hi: 'बिल भुगतान' },
                'documents': { en: 'Documents', hi: 'दस्तावेज़' },
                'official-entry': { en: 'Official Entry', hi: 'अधिकारी प्रवेश' },
                'official-dashboard': { en: 'Official Dashboard', hi: 'अधिकारी डैशबोर्ड' }
            };
            const title = screenTitles[screenId] ? screenTitles[screenId][currentLanguage] : (currentLanguage === 'en' ? 'New Page' : 'नया पृष्ठ');
            speak(title);
        }
    }
}

function showScreen(screenId) {
    document.getElementById(screenId).classList.add('active');
}

function hideScreen(screenId) {
    document.getElementById(screenId).classList.remove('active');
}

// Language Toggle Functions
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'hi' : 'en';
    localStorage.setItem('preferredLanguage', currentLanguage);
    updateLanguage();
    
    if (isVoiceAssistantEnabled) {
        speak(t('languageChanged'));
    }
}

function updateLanguage() {
    // Update all elements with data-en and data-hi attributes
    const elements = document.querySelectorAll('[data-en][data-hi]');
    elements.forEach(element => {
        const text = currentLanguage === 'en' ? element.getAttribute('data-en') : element.getAttribute('data-hi');
        if (text) {
            element.textContent = text;
        }
    });
    
    // Update language toggle button text
    const langButtons = document.querySelectorAll('.language-toggle span, #lang-text, #lang-text-home');
    langButtons.forEach(btn => {
        btn.textContent = currentLanguage === 'en' ? 'हिंदी' : 'English';
    });
    
    // Update placeholders
    updatePlaceholders();
}

function updatePlaceholders() {
    // Update all elements with data-placeholder-en and data-placeholder-hi attributes
    const placeholderElements = document.querySelectorAll('[data-placeholder-en][data-placeholder-hi]');
    placeholderElements.forEach(element => {
        const enPlaceholder = element.getAttribute('data-placeholder-en');
        const hiPlaceholder = element.getAttribute('data-placeholder-hi');
        if (enPlaceholder && hiPlaceholder) {
            element.placeholder = currentLanguage === 'en' ? enPlaceholder : hiPlaceholder;
        }
    });
    
    // Legacy placeholder updates for specific elements
    const specificPlaceholders = {
        'complaint-description': {
            en: 'Describe your complaint here...',
            hi: 'अपनी शिकायत यहाँ लिखें...'
        },
        'quick-complaint-text': {
            en: 'Enter your complaint quickly...',
            hi: 'तुरंत शिकायत दर्ज करें...'
        },
        'scheme-search': {
            en: 'Search schemes...',
            hi: 'योजना खोजें...'
        }
    };
    
    Object.keys(specificPlaceholders).forEach(id => {
        const element = document.getElementById(id);
        if (element && !element.hasAttribute('data-placeholder-en')) {
            element.placeholder = specificPlaceholders[id][currentLanguage];
        }
    });
    
    // Update select options
    updateSelectOptions();
}

function updateSelectOptions() {
    const complaintSector = document.getElementById('complaint-sector');
    if (complaintSector) {
        const options = complaintSector.querySelectorAll('option');
        options.forEach(option => {
            const enText = option.getAttribute('data-en');
            const hiText = option.getAttribute('data-hi');
            if (enText && hiText) {
                option.textContent = currentLanguage === 'en' ? enText : hiText;
            }
        });
    }
}

// Voice Assistant Functions
function toggleVoiceAssistant() {
    isVoiceAssistantEnabled = !isVoiceAssistantEnabled;
    const btns = document.querySelectorAll('#voice-assistant-btn, #voice-assistant-btn-home');
    
    btns.forEach(btn => {
        if (isVoiceAssistantEnabled) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    const message = isVoiceAssistantEnabled ? 'Voice assistant enabled' : 'Voice assistant disabled';
    
    if (isVoiceAssistantEnabled) {
        speak(message);
    }
}

function speak(text) {
    if ('speechSynthesis' in window && isVoiceAssistantEnabled) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLanguage === 'en' ? 'en-IN' : 'hi-IN';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}

function initializeSampleData() {
    // Initialize with sample complaint data if none exists
    if (complaints.length === 0) {
        complaints = [
            {
                id: '#12345',
                subject: 'Water supply issue in Sector 7',
                description: 'No water supply for the past 3 days',
                sector: 'water',
                status: 'pending',
                date: new Date().toISOString(),
                userId: 'sample'
            },
            {
                id: '#12344',
                subject: 'Road repair request near market',
                description: 'Large potholes making travel difficult',
                sector: 'roads',
                status: 'resolved',
                date: new Date(Date.now() - 86400000).toISOString(),
                userId: 'sample'
            },
            {
                id: '#12343',
                subject: 'Electricity outage in Block B',
                description: 'Power cuts lasting more than 8 hours daily',
                sector: 'electricity',
                status: 'in-progress',
                date: new Date(Date.now() - 172800000).toISOString(),
                userId: 'sample'
            }
        ];
        localStorage.setItem('complaints', JSON.stringify(complaints));
    }
    
    // Load complaint status on documents page
    loadComplaintStatusList();
}

function startVoiceInput(targetField) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showMessage('आपका ब्राउज़र आवाज़ पहचान का समर्थन नहीं करता', 'error');
        return;
    }
    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function() {
        isListening = true;
        showVoiceInterface();
        speak('बोलना शुरू करें');
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        
        if (targetField === 'quick-complaint') {
            document.getElementById('quick-complaint-text').value = transcript;
        } else if (targetField === 'complaint') {
            document.getElementById('complaint-description').value = transcript;
        }
        
        showMessage('आवाज़ सफलतापूर्वक पकड़ी गई', 'success');
    };
    
    recognition.onerror = function(event) {
        showMessage('आवाज़ पहचानने में त्रुटि हुई', 'error');
        hideVoiceInterface();
    };
    
    recognition.onend = function() {
        isListening = false;
        hideVoiceInterface();
    };
    
    recognition.start();
}

function startVoiceSearch(section) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showMessage('आपका ब्राउज़र आवाज़ पहचान का समर्थन नहीं करता', 'error');
        return;
    }
    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function() {
        showVoiceInterface();
        speak('योजना खोजने के लिए बोलें');
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('scheme-search').value = transcript;
        filterSchemes('all', transcript);
        showMessage('खोज पूरी हुई', 'success');
    };
    
    recognition.onerror = function(event) {
        showMessage('आवाज़ पहचानने में त्रुटि हुई', 'error');
    };
    
    recognition.onend = function() {
        hideVoiceInterface();
    };
    
    recognition.start();
}

function showVoiceInterface() {
    document.getElementById('voice-interface').classList.add('active');
}

function hideVoiceInterface() {
    document.getElementById('voice-interface').classList.remove('active');
}

// Authentication Functions
function switchAuthTab(tab) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from tabs
    document.querySelectorAll('.auth-tab').forEach(tabBtn => {
        tabBtn.classList.remove('active');
    });
    
    // Show selected form and tab
    document.getElementById(tab + '-form').classList.add('active');
    event.target.classList.add('active');
}

function switchOfficialTab(tab) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from tabs
    document.querySelectorAll('.auth-tab').forEach(tabBtn => {
        tabBtn.classList.remove('active');
    });
    
    // Show selected form and tab
    document.getElementById(tab + '-form').classList.add('active');
    event.target.classList.add('active');
}

function loginUser() {
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    
    if (!phone || !password) {
        showMessage('कृपया सभी फ़ील्ड भरें', 'error');
        return;
    }
    
    // Simple validation
    if (phone.length !== 10) {
        showMessage('कृपया वैध मोबाइल नंबर दर्ज करें', 'error');
        return;
    }
    
    // Mock login
    currentUser = { phone, name: 'User' };
    showMessage('सफलतापूर्वक लॉगिन हो गए', 'success');
    navigateTo('user-home');
}

function registerUser() {
    const aadhaar = document.getElementById('aadhaar-number').value;
    const phone = document.getElementById('register-phone').value;
    const email = document.getElementById('register-email').value;
    const address = document.getElementById('register-address').value;
    const password = document.getElementById('register-password').value;
    
    if (!aadhaar || !phone || !email || !address || !password) {
        showMessage('कृपया सभी फ़ील्ड भरें', 'error');
        return;
    }
    
    // Basic validation
    if (aadhaar.length !== 12) {
        showMessage('कृपया वैध आधार नंबर दर्ज करें', 'error');
        return;
    }
    
    if (phone.length !== 10) {
        showMessage('कृपया वैध मोबाइल नंबर दर्ज करें', 'error');
        return;
    }
    
    // Mock registration
    const newUser = { aadhaar, phone, email, address, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage('सफलतापूर्वक पंजीकरण हो गया', 'success');
    currentUser = newUser;
    navigateTo('user-home');
}

function sendOTP() {
    const phone = document.getElementById('login-phone').value;
    
    if (!phone || phone.length !== 10) {
        showMessage('कृपया वैध मोबाइल नंबर दर्ज करें', 'error');
        return;
    }
    
    showMessage('OTP आपके मोबाइल नंबर पर भेजा गया है', 'success');
}

// Official Authentication Functions
function loginOfficial() {
    const employeeId = document.getElementById('official-id').value;
    const password = document.getElementById('official-password').value;
    
    if (!employeeId || !password) {
        showMessage('कृपया सभी फ़ील्ड भरें', 'error');
        return;
    }
    
    // Mock login
    currentOfficial = { employeeId, name: 'Official', department: 'General' };
    showMessage('सफलतापूर्वक लॉगिन हो गए', 'success');
    navigateTo('official-dashboard');
    loadOfficialDashboard();
}

function registerOfficial() {
    const name = document.getElementById('official-name').value;
    const employeeId = document.getElementById('official-register-id').value;
    const department = document.getElementById('official-department').value;
    const email = document.getElementById('official-email').value;
    const password = document.getElementById('official-register-password').value;
    
    if (!name || !employeeId || !department || !email || !password) {
        showMessage('कृपया सभी फ़ील्ड भरें', 'error');
        return;
    }
    
    // Mock registration
    const newOfficial = { name, employeeId, department, email, password };
    officials.push(newOfficial);
    localStorage.setItem('officials', JSON.stringify(officials));
    
    showMessage('सफलतापूर्वक पंजीकरण हो गया', 'success');
    currentOfficial = newOfficial;
    navigateTo('official-dashboard');
    loadOfficialDashboard();
}

function logoutOfficial() {
    currentOfficial = null;
    showMessage('सफलतापूर्वक लॉग आउट हो गए', 'success');
    navigateTo('home');
}

// User logout function
function logoutUser() {
    currentUser = null;
    const message = currentLanguage === 'en' ? 'Successfully logged out' : 'सफलतापूर्वक लॉग आउट हो गए';
    showMessage(message, 'success');
    navigateTo('home');
}

// Schemes Functions
function loadSchemes() {
    schemes = [
        {
            id: 1,
            name: {
                en: 'PM Housing Scheme',
                hi: 'प्रधानमंत्री आवास योजना'
            },
            category: 'finance',
            description: {
                en: 'Affordable housing for all',
                hi: 'सभी के लिए किफायती आवास'
            },
            benefits: {
                en: 'Financial assistance, subsidies',
                hi: 'वित्तीय सहायता, सब्सिडी'
            }
        },
        {
            id: 2,
            name: {
                en: 'Ayushman Bharat',
                hi: 'आयुष्मान भारत'
            },
            category: 'health',
            description: {
                en: 'Health insurance scheme',
                hi: 'स्वास्थ्य बीमा योजना'
            },
            benefits: {
                en: 'Coverage up to ₹5 lakh',
                hi: '₹5 लाख तक का कवरेज'
            }
        },
        {
            id: 3,
            name: {
                en: 'Beti Bachao Beti Padhao',
                hi: 'बेटी बचाओ बेटी पढ़ाओ'
            },
            category: 'education',
            description: {
                en: 'Girl child education and safety',
                hi: 'बालिका शिक्षा और सुरक्षा'
            },
            benefits: {
                en: 'Education support, awareness',
                hi: 'शिक्षा सहायता, जागरूकता'
            }
        },
        {
            id: 4,
            name: {
                en: 'PM Kisan Samman Nidhi',
                hi: 'किसान सम्मान निधि'
            },
            category: 'agriculture',
            description: {
                en: 'Financial support for farmers',
                hi: 'किसानों के लिए आर्थिक सहायता'
            },
            benefits: {
                en: '₹6000 annual assistance',
                hi: '₹6000 सालाना सहायता'
            }
        },
        {
            id: 5,
            name: {
                en: 'Jan Dhan Yojana',
                hi: 'जन धन योजना'
            },
            category: 'finance',
            description: {
                en: 'Financial inclusion scheme',
                hi: 'वित्तीय समावेशन योजना'
            },
            benefits: {
                en: 'Free bank account, insurance',
                hi: 'मुफ्त बैंक खाता, बीमा'
            }
        }
    ];
    displaySchemes(schemes);
}

function filterSchemes(category, searchTerm = '') {
    let filteredSchemes = schemes;
    
    if (category !== 'all') {
        filteredSchemes = schemes.filter(scheme => scheme.category === category);
    }
    
    if (searchTerm) {
        filteredSchemes = filteredSchemes.filter(scheme => {
            const name = typeof scheme.name === 'object' ? scheme.name[currentLanguage] : scheme.name;
            const description = typeof scheme.description === 'object' ? scheme.description[currentLanguage] : scheme.description;
            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   description.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }
    
    displaySchemes(filteredSchemes);
    
    // Update active tab
    if (event && event.target) {
        document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
    }
}

function displaySchemes(schemesToShow) {
    const schemesList = document.getElementById('schemes-list');
    if (!schemesList) return;
    
    schemesList.innerHTML = '';
    
    schemesToShow.forEach(scheme => {
        const schemeCard = document.createElement('div');
        schemeCard.className = 'scheme-card';
        
        const name = typeof scheme.name === 'object' ? scheme.name[currentLanguage] : scheme.name;
        const description = typeof scheme.description === 'object' ? scheme.description[currentLanguage] : scheme.description;
        const benefits = typeof scheme.benefits === 'object' ? scheme.benefits[currentLanguage] : scheme.benefits;
        const benefitsLabel = currentLanguage === 'en' ? 'Benefits: ' : 'लाभ: ';
        const applyText = currentLanguage === 'en' ? 'Apply' : 'आवेदन करें';
        
        schemeCard.innerHTML = `
            <h3>${name}</h3>
            <p class="scheme-description">${description}</p>
            <p class="scheme-benefits">${benefitsLabel}${benefits}</p>
            <button class="apply-btn" onclick="applyForScheme(${scheme.id})">${applyText}</button>
        `;
        schemesList.appendChild(schemeCard);
    });
}

function applyForScheme(schemeId) {
    const scheme = schemes.find(s => s.id === schemeId);
    if (scheme) {
        const name = typeof scheme.name === 'object' ? scheme.name[currentLanguage] : scheme.name;
        const message = currentLanguage === 'en' 
            ? `Application started for ${name}` 
            : `${name} के लिए आवेदन शुरू किया गया`;
        showMessage(message, 'success');
    }
}

// Complaints Functions
function submitComplaint() {
    const subject = document.getElementById('complaint-subject').value;
    const sector = document.getElementById('complaint-sector').value;
    const description = document.getElementById('complaint-description').value;
    
    if (!subject || !sector || !description) {
        showMessage('कृपया सभी फ़ील्ड भरें', 'error');
        return;
    }
    
    const newComplaint = {
        id: '#' + Math.floor(Math.random() * 90000 + 10000),
        subject,
        sector,
        description,
        status: 'pending',
        date: new Date().toISOString(),
        userId: currentUser ? currentUser.phone : 'anonymous'
    };
    
    complaints.push(newComplaint);
    localStorage.setItem('complaints', JSON.stringify(complaints));
    
    showMessage(`शिकायत दर्ज की गई। शिकायत ID: ${newComplaint.id}`, 'success');
    
    // Clear form
    document.getElementById('complaint-subject').value = '';
    document.getElementById('complaint-sector').value = '';
    document.getElementById('complaint-description').value = '';
}

function submitQuickComplaint() {
    const description = document.getElementById('quick-complaint-text').value;
    
    if (!description) {
        showMessage('कृपया शिकायत का विवरण दें', 'error');
        return;
    }
    
    const newComplaint = {
        id: '#' + Math.floor(Math.random() * 90000 + 10000),
        subject: 'त्वरित शिकायत',
        sector: 'general',
        description,
        status: 'pending',
        date: new Date().toISOString(),
        userId: currentUser ? currentUser.phone : 'anonymous'
    };
    
    complaints.push(newComplaint);
    localStorage.setItem('complaints', JSON.stringify(complaints));
    
    showMessage(`त्वरित शिकायत दर्ज की गई। ID: ${newComplaint.id}`, 'success');
    
    // Clear form
    document.getElementById('quick-complaint-text').value = '';
}

// Bill Payment Functions
function payBill(billType) {
    const billTypes = {
        'electricity': 'बिजली',
        'water': 'पानी',
        'property': 'प्रॉपर्टी टैक्स',
        'mobile': 'मोबाइल'
    };
    
    showMessage(`${billTypes[billType]} का बिल भुगतान फॉर्म खुल रहा है`, 'info');
}

// Documents Functions
function viewDocument(docType) {
    const docTypes = {
        'aadhaar': 'आधार कार्ड',
        'pan': 'पैन कार्ड',
        'driving': 'ड्राइविंग लाइसेंस',
        'passport': 'पासपोर्ट',
        'voter': 'वोटर आईडी',
        'income': 'आय प्रमाण पत्र',
        'residence': 'निवास प्रमाण पत्र'
    };
    
    showMessage(`${docTypes[docType]} देखा जा रहा है`, 'info');
}

function uploadDocument() {
    showMessage('दस्तावेज़ अपलोड फॉर्म खुल रहा है', 'info');
}

function loadComplaintStatusList() {
    const statusList = document.getElementById('status-list');
    if (!statusList) return;
    
    statusList.innerHTML = '';
    
    complaints.forEach(complaint => {
        const statusItem = document.createElement('div');
        statusItem.className = `status-item ${complaint.status}`;
        statusItem.innerHTML = `
            <h4>${complaint.id}</h4>
            <p>${complaint.subject}</p>
            <span class="status-badge ${complaint.status}">${getStatusText(complaint.status)}</span>
        `;
        statusList.appendChild(statusItem);
    });
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'लंबित',
        'in-progress': 'प्रगति में',
        'resolved': 'हल किया गया'
    };
    return statusTexts[status] || status;
}

// Official Dashboard Functions
function loadOfficialDashboard() {
    updateDashboardStats();
    loadOfficialComplaints();
}

function updateDashboardStats() {
    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
    const inProgressComplaints = complaints.filter(c => c.status === 'in-progress').length;
    
    document.getElementById('total-complaints').textContent = totalComplaints;
    document.getElementById('pending-complaints').textContent = pendingComplaints;
    document.getElementById('resolved-complaints').textContent = resolvedComplaints;
    document.getElementById('inprogress-complaints').textContent = inProgressComplaints;
}

function loadOfficialComplaints() {
    const complaintsList = document.getElementById('official-complaints-list');
    if (!complaintsList) return;
    
    complaintsList.innerHTML = '';
    
    complaints.forEach(complaint => {
        const complaintItem = document.createElement('div');
        complaintItem.className = 'official-complaint-item';
        complaintItem.innerHTML = `
            <div class="complaint-header">
                <span class="complaint-id">${complaint.id}</span>
                <span class="complaint-date">${new Date(complaint.date).toLocaleDateString('hi-IN')}</span>
            </div>
            <h4>${complaint.subject}</h4>
            <p>${complaint.description}</p>
            <div class="complaint-footer">
                <span class="complaint-sector">${complaint.sector}</span>
                <select onchange="updateComplaintStatus('${complaint.id}', this.value)" class="status-select">
                    <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>लंबित</option>
                    <option value="in-progress" ${complaint.status === 'in-progress' ? 'selected' : ''}>प्रगति में</option>
                    <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>हल किया गया</option>
                </select>
            </div>
        `;
        complaintsList.appendChild(complaintItem);
    });
}

function filterComplaints(status) {
    const complaintsList = document.getElementById('official-complaints-list');
    if (!complaintsList) return;
    
    const complaintItems = complaintsList.querySelectorAll('.official-complaint-item');
    
    complaintItems.forEach(item => {
        const select = item.querySelector('.status-select');
        const itemStatus = select.value;
        
        if (status === 'all' || itemStatus === status) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function updateComplaintStatus(complaintId, newStatus) {
    const complaintIndex = complaints.findIndex(c => c.id === complaintId);
    if (complaintIndex !== -1) {
        complaints[complaintIndex].status = newStatus;
        localStorage.setItem('complaints', JSON.stringify(complaints));
        updateDashboardStats();
        showMessage('शिकायत की स्थिति अपडेट की गई', 'success');
    }
}

// Message System
function showMessage(message, type = 'info') {
    const toast = document.getElementById('message-toast');
    const messageElement = document.getElementById('toast-message');
    
    messageElement.textContent = message;
    toast.className = `message-toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
    
    if (isVoiceAssistantEnabled) {
        speak(message);
    }
}

// Search functionality with proper language handling
document.addEventListener('DOMContentLoaded', function() {
    const schemeSearch = document.getElementById('scheme-search');
    if (schemeSearch) {
        schemeSearch.addEventListener('input', function() {
            // Get current active category
            const activeTab = document.querySelector('.category-tab.active');
            const category = activeTab ? activeTab.getAttribute('onclick').match(/filterSchemes\('([^']+)'/)[1] : 'all';
            filterSchemes(category, this.value);
        });
    }
});
