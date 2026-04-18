// API Configuration - Update this to your backend URL when deployed
const API_URL = 'http://localhost:5000/api';

// Global variables
let yieldChart = null;
let weatherChart = null;
let indiaMap = null;
let currentLocation = null;

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeCharts();
    loadSchemes();
    loadNews();
    loadShopItems('fertilizers');
    setupEventListeners();
    testConnection();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('predictionForm').addEventListener('submit', handlePrediction);
    document.getElementById('languageSelect').addEventListener('change', handleLanguageChange);
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('active');
    });
    
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Handle crop yield prediction
async function handlePrediction(e) {
    e.preventDefault();
    showLoading(true);
    
    const formData = {
        temperature: parseFloat(document.getElementById('temperature').value),
        rainfall: parseFloat(document.getElementById('rainfall').value),
        humidity: parseFloat(document.getElementById('humidity').value),
        soil_type: document.getElementById('soilType').value,
        crop_type: document.getElementById('cropType').value
    };
    
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayPredictionResult(result.data);
            showNotification('Prediction completed successfully!', 'success');
        } else {
            showNotification('Error making prediction', 'error');
        }
    } catch (error) {
        console.error('Prediction error:', error);
        showNotification('Failed to connect to server. Make sure backend is running on port 5000', 'error');
    }
    
    showLoading(false);
}

// Display prediction results
function displayPredictionResult(data) {
    const resultDiv = document.getElementById('predictionResult');
    const yieldValue = document.getElementById('yieldValue');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');
    const recommendationText = document.getElementById('recommendationText');
    const fertilizerTip = document.getElementById('fertilizerTip');
    const irrigationTip = document.getElementById('irrigationTip');
    
    yieldValue.textContent = data.predicted_yield.toLocaleString();
    confidenceFill.style.width = `${data.confidence_score * 100}%`;
    confidenceValue.textContent = `${Math.round(data.confidence_score * 100)}%`;
    
    recommendationText.textContent = data.recommendation.action;
    fertilizerTip.textContent = data.recommendation.fertilizer_tip;
    irrigationTip.textContent = data.recommendation.irrigation_tip;
    
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// Initialize Leaflet map
function initializeMap() {
    indiaMap = L.map('indiaMap').setView([20.5937, 78.9629], 5);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
    }).addTo(indiaMap);
    
    const states = [
        { name: 'Maharashtra', lat: 19.7515, lng: 75.7139, soil: 'Black Soil', temp: 28, humidity: 60 },
        { name: 'Punjab', lat: 31.1471, lng: 75.3412, soil: 'Alluvial Soil', temp: 24, humidity: 55 },
        { name: 'Gujarat', lat: 22.2587, lng: 71.1924, soil: 'Sandy Soil', temp: 30, humidity: 50 },
        { name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, soil: 'Loamy Soil', temp: 26, humidity: 65 },
        { name: 'Karnataka', lat: 15.3173, lng: 75.7139, soil: 'Red Soil', temp: 27, humidity: 62 },
        { name: 'Rajasthan', lat: 27.0238, lng: 74.2179, soil: 'Sandy Soil', temp: 32, humidity: 45 },
        { name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569, soil: 'Red Soil', temp: 29, humidity: 70 },
        { name: 'West Bengal', lat: 22.9868, lng: 87.8550, soil: 'Alluvial Soil', temp: 26, humidity: 75 }
    ];
    
    states.forEach(state => {
        const marker = L.marker([state.lat, state.lng]).addTo(indiaMap);
        marker.bindPopup(`
            <b>${state.name}</b><br>
            🌱 Soil: ${state.soil}<br>
            🌡️ Temp: ${state.temp}°C<br>
            💧 Humidity: ${state.humidity}%
        `);
        
        marker.on('click', () => {
            currentLocation = state;
            document.getElementById('selectedLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${state.name}`;
            document.getElementById('soilInfo').innerHTML = `<i class="fas fa-globe-asia"></i> Soil: ${state.soil}`;
            document.getElementById('tempInfo').innerHTML = `<i class="fas fa-temperature-high"></i> Temp: ${state.temp}°C`;
            document.getElementById('humidityInfo').innerHTML = `<i class="fas fa-tint"></i> Humidity: ${state.humidity}%`;
            document.getElementById('mapInfo').style.display = 'block';
        });
    });
}

// Fill prediction form from map selection
function fillFormFromMap() {
    if (currentLocation) {
        document.getElementById('temperature').value = currentLocation.temp;
        document.getElementById('humidity').value = currentLocation.humidity;
        
        const soilMap = {
            'Black Soil': 'Loamy',
            'Alluvial Soil': 'Loamy',
            'Sandy Soil': 'Sandy',
            'Loamy Soil': 'Loamy',
            'Red Soil': 'Clay'
        };
        
        if (soilMap[currentLocation.soil]) {
            document.getElementById('soilType').value = soilMap[currentLocation.soil];
        }
        
        document.getElementById('prediction').scrollIntoView({ behavior: 'smooth' });
        showNotification('Form filled with location data!', 'success');
    }
}

// Initialize charts
function initializeCharts() {
    const yieldCtx = document.getElementById('yieldChart').getContext('2d');
    const weatherCtx = document.getElementById('weatherChart').getContext('2d');
    
    yieldChart = new Chart(yieldCtx, {
        type: 'bar',
        data: {
            labels: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Millet'],
            datasets: [{
                label: 'Yield (kg/hectare)',
                data: [4500, 3500, 2800, 6500, 2000],
                backgroundColor: '#2E7D32',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
    
    weatherChart = new Chart(weatherCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: [22, 24, 28, 32, 35, 33],
                    borderColor: '#FDD835',
                    backgroundColor: 'rgba(253, 216, 53, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Rainfall (mm)',
                    data: [15, 20, 25, 40, 60, 120],
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// Load government schemes
async function loadSchemes() {
    try {
        const response = await fetch(`${API_URL}/schemes`);
        const data = await response.json();
        displaySchemes(data.schemes);
    } catch (error) {
        displaySchemes(getMockSchemes());
    }
}

function displaySchemes(schemes) {
    const grid = document.getElementById('schemesGrid');
    grid.innerHTML = schemes.map(scheme => `
        <div class="scheme-card">
            <h4><i class="fas fa-hand-holding-heart"></i> ${scheme.name}</h4>
            <p>${scheme.description}</p>
            <div class="benefit">💰 ${scheme.benefit}</div>
            <small>✅ Eligibility: ${scheme.eligibility}</small>
        </div>
    `).join('');
}

function filterSchemes() {
    const searchTerm = document.getElementById('schemeSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.scheme-card');
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const desc = card.querySelector('p').textContent.toLowerCase();
        card.style.display = title.includes(searchTerm) || desc.includes(searchTerm) ? 'block' : 'none';
    });
}

// Load agriculture news
async function loadNews() {
    try {
        const response = await fetch(`${API_URL}/news`);
        const data = await response.json();
        displayNews(data.news);
    } catch (error) {
        displayNews(getMockNews());
    }
}

function displayNews(newsItems) {
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = newsItems.map(news => `
        <div class="news-card">
            <div class="category-tag">${news.category}</div>
            <h4>${news.title}</h4>
            <p>${news.summary}</p>
            <div class="date">📅 ${news.date} | Source: ${news.source}</div>
        </div>
    `).join('');
}

// Load shop items
async function loadShopItems(category) {
    try {
        const response = await fetch(`${API_URL}/shop-items`);
        const data = await response.json();
        displayShopItems(data[category], category);
    } catch (error) {
        displayShopItems(getMockShopItems(category), category);
    }
}

function displayShopItems(items, category) {
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = items.map(item => `
        <div class="shop-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="shop-item-content">
                <h4>${item.name}</h4>
                <p class="price">${item.price}</p>
                <button class="buy-btn" onclick="window.open('${item.amazon_link}', '_blank')">
                    Buy Now on Amazon <i class="fas fa-external-link-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function showShopCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    loadShopItems(category);
}

// Chat functionality
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        const data = await response.json();
        addChatMessage(data.response, 'bot');
    } catch (error) {
        addChatMessage("I'm having trouble connecting. Please try again later.", 'bot');
    }
    showLoading(false);
}

function addChatMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    const icon = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '';
    messageDiv.innerHTML = `<div class="message-content">${icon}<p>${text}</p></div>`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') sendMessage();
}

// Language handling
function handleLanguageChange() {
    const lang = document.getElementById('languageSelect').value;
    const translations = {
        'en': { hero_title: 'Smart Agriculture for Modern Farmers' },
        'hi': { hero_title: 'आधुनिक किसानों के लिए स्मार्ट कृषि' },
        'gu': { hero_title: 'આધુનિક ખેડૂતો માટે સ્માર્ટ એગ્રીકલ્ચર' }
    };
    if (translations[lang]) {
        document.querySelector('.hero-content h1').innerHTML = translations[lang].hero_title + '<br><span>Modern Farmers</span>';
    }
    showNotification(`Language changed to ${lang.toUpperCase()}`, 'success');
}

// Utility functions
function showLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    if (!loader && show) {
        const div = document.createElement('div');
        div.id = 'loadingIndicator';
        div.innerHTML = '<div class="loading"></div>';
        div.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;';
        document.body.appendChild(div);
    } else if (!show && loader) loader.remove();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    notification.style.background = type === 'success' ? '#2E7D32' : '#f44336';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function testConnection() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            showNotification('Connected to AgroSmart Pro backend!', 'success');
            console.log('✅ Backend connected');
        }
    } catch (error) {
        console.log('⚠️ Backend not connected. Start server with: python backend/app.py');
        showNotification('Backend not running. Starting in demo mode.', 'info');
    }
}

function scrollToPrediction() { 
    document.getElementById('prediction').scrollIntoView({ behavior: 'smooth' }); 
}

function scrollToAssistant() { 
    document.getElementById('assistant').scrollIntoView({ behavior: 'smooth' }); 
}

// Mock data for fallback
function getMockSchemes() {
    return [
        { name: 'PM-KISAN Samman Nidhi', description: 'Income support of ₹6000 per year to small farmers', benefit: '₹6000/year', eligibility: 'Small and marginal farmers' },
        { name: 'Pradhan Mantri Fasal Bima Yojana', description: 'Crop insurance scheme for yield loss', benefit: 'Insurance coverage at low premium', eligibility: 'All farmers' },
        { name: 'Soil Health Card Scheme', description: 'Soil testing and health card distribution', benefit: 'Free soil testing', eligibility: 'All farmers' },
        { name: 'Kisan Credit Card (KCC)', description: 'Credit facility for agricultural needs', benefit: 'Easy credit up to ₹3 lakh', eligibility: 'Farmers' }
    ];
}

function getMockNews() {
    return [
        { title: 'Government announces MSP hike for Rabi crops', summary: 'Minimum Support Price increased for wheat, mustard, and gram', source: 'Ministry of Agriculture', date: '2024-01-15', category: 'Policy' },
        { title: 'New drought-resistant wheat variety developed', summary: 'ICAR scientists develop variety requiring 30% less water', source: 'ICAR News', date: '2024-01-14', category: 'Technology' },
        { title: 'Organic farming subsidies increased by 25%', summary: 'Government boosts support for chemical-free agriculture', source: 'Agricultural Ministry', date: '2024-01-13', category: 'Policy' }
    ];
}

function getMockShopItems(category) {
    const items = {
        fertilizers: [
            { name: 'NPK 20:20:20', price: '₹450/kg', image: 'https://via.placeholder.com/150', amazon_link: '#' },
            { name: 'Organic Compost', price: '₹300/kg', image: 'https://via.placeholder.com/150', amazon_link: '#' }
        ],
        tools: [
            { name: 'Hand Tractor', price: '₹25,000', image: 'https://via.placeholder.com/150', amazon_link: '#' },
            { name: 'Pruning Shears', price: '₹450', image: 'https://via.placeholder.com/150', amazon_link: '#' }
        ],
        seeds: [
            { name: 'Hybrid Rice Seeds', price: '₹650/kg', image: 'https://via.placeholder.com/150', amazon_link: '#' },
            { name: 'Wheat Seeds', price: '₹550/kg', image: 'https://via.placeholder.com/150', amazon_link: '#' }
        ]
    };
    return items[category] || [];
}