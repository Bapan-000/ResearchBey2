document.addEventListener('DOMContentLoaded', () => {
    
    // State
    let maxUnlockedStep = 1;
    const data = {
        businessName: '',
        audienceType: '',
        domain: '',
        niche: '',
        locality: '',
        priceMin: 0,
        priceMax: 50000,
        quality: ''
    };

    const nicheMap = {
        'Clothing': ['Shirt', 'T-shirt', 'Jeans', 'Trousers', 'Activewear', 'Ethnic Wear'],
        'Hotel': ['Full Day', 'Half Day', 'Hourly', 'Resort', 'Business Suites'],
        'Restaurant': ['Indian', 'Chinese', 'Continental', 'South Indian', 'Cafe / Bakery', 'Fast Food'],
        'Footwear': ['Formal Shoes', 'Slippers', 'Sneakers', 'Boots', 'Casual Shoes']
    };

    const unlockStep = (stepNumber) => {
        if (stepNumber <= maxUnlockedStep) return; // Already unlocked or skipped
        maxUnlockedStep = stepNumber;
        const elm = document.getElementById(`step-${stepNumber}`);
        if(elm) {
            elm.classList.add('unlocked');
            // Allow a tiny delay for animation DOM to register
            setTimeout(() => {
                elm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        }
    };

    // -- Component Actions --

    // Step 1: Text Input Next Button
    document.getElementById('btn-next-1').addEventListener('click', () => {
        const val = document.getElementById('input-business-name').value.trim();
        if (val) {
            data.businessName = val;
            unlockStep(2);
        } else {
            alert('Please enter your business name first.');
        }
    });

    // Step 2 & 7: Selection Cards
    document.querySelectorAll('.selectable-card').forEach(card => {
        card.addEventListener('click', () => {
            const group = card.getAttribute('data-group');
            const value = card.getAttribute('data-value');
            
            // Visual reset config
            document.querySelectorAll(`.selectable-card[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (group === 'audience') {
                data.audienceType = value;
                unlockStep(3);
            }
            if (group === 'domain') {
                data.domain = value;
                data.niche = ''; // Reset niche
                populateNiches();
                unlockStep(4);
            }
            if (group === 'quality') {
                data.quality = value;
                unlockStep(8); // Unlock the submit block
            }
        });
    });

    // Step 4 Dynamic Population
    function populateNiches() {
        const container = document.getElementById('niche-container');
        const displayDomain = document.getElementById('display-domain');
        const niches = nicheMap[data.domain] || [];
        
        container.innerHTML = '';
        displayDomain.innerText = data.domain;
        
        niches.forEach(niche => {
            const el = document.createElement('div');
            el.className = `niche-pill px-6 py-3 rounded-full border border-slate-200 text-base font-bold bg-white text-slate-700 hover:border-primary`;
            el.innerText = niche;
            el.addEventListener('click', () => {
                document.querySelectorAll('.niche-pill').forEach(p => p.classList.remove('selected'));
                el.classList.add('selected');
                data.niche = niche;
                unlockStep(5);
            });
            container.appendChild(el);
        });
    }

    // Step 5: Locality Next Button
    document.getElementById('btn-next-5').addEventListener('click', () => {
        const val = document.getElementById('input-locality').value.trim();
        if (val) {
            data.locality = val;
            unlockStep(6);
        } else {
            alert('Please enter your locality.');
        }
    });

    // Step 6: Dual Slider Setup
    const thumbMin = document.getElementById('thumb-min');
    const thumbMax = document.getElementById('thumb-max');
    const valueMin = document.getElementById('value-min');
    const valueMax = document.getElementById('value-max');
    const sliderTrack = document.getElementById('slider-track');
    const sliderFill = document.getElementById('slider-fill');
    
    let isDraggingMin = false;
    let isDraggingMax = false;
    const MAX_PRICE = 50000;

    function updateSliderUI() {
        const percentMin = (data.priceMin / MAX_PRICE) * 100;
        const percentMax = (data.priceMax / MAX_PRICE) * 100;
        
        thumbMin.style.left = `${percentMin}%`;
        thumbMax.style.left = `${percentMax}%`;
        
        sliderFill.style.left = `${percentMin}%`;
        sliderFill.style.width = `${percentMax - percentMin}%`;
        
        valueMin.innerText = `Rs ${Math.round(data.priceMin).toLocaleString()}`;
        valueMax.innerText = `Rs ${Math.round(data.priceMax).toLocaleString()}`;
    }

    function handleDrag(e) {
        if (!isDraggingMin && !isDraggingMax) return;
        
        const rect = sliderTrack.getBoundingClientRect();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        if (!clientX) return;

        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        let val = percent * MAX_PRICE;

        if (isDraggingMin) {
            data.priceMin = Math.min(val, data.priceMax - 1000); // 1000 margin
        } else if (isDraggingMax) {
            data.priceMax = Math.max(val, data.priceMin + 1000);
        }
        updateSliderUI();
    }

    thumbMin.addEventListener('mousedown', () => isDraggingMin = true);
    thumbMin.addEventListener('touchstart', () => isDraggingMin = true, {passive: true});
    thumbMax.addEventListener('mousedown', () => isDraggingMax = true);
    thumbMax.addEventListener('touchstart', () => isDraggingMax = true, {passive: true});
    
    document.addEventListener('mouseup', () => { isDraggingMin = false; isDraggingMax = false; });
    document.addEventListener('touchend', () => { isDraggingMin = false; isDraggingMax = false; });
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('touchmove', handleDrag, {passive: true});
    updateSliderUI();

    document.getElementById('btn-next-6').addEventListener('click', () => {
        unlockStep(7);
    });

    // Step 8: Submission
    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.addEventListener('click', async () => {
        // Quick final validation
        if (!data.businessName || !data.audienceType || !data.domain || !data.niche || !data.locality || !data.quality) {
            alert("It looks like you skipped a required field! Please scroll up and make sure everything is selected.");
            return;
        }

        const oldText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = `Saving...`;
        btnSubmit.disabled = true;

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                // Show success screen
                document.getElementById('success-screen').classList.remove('hidden');
                document.getElementById('success-screen').classList.add('flex');
            } else {
                alert('Failed to save data. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Cannot connect to the backend server. Make sure node server.js is running.');
        } finally {
            btnSubmit.innerHTML = oldText;
            btnSubmit.disabled = false;
        }
    });

});
