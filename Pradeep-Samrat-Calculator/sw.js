// यह Workbox का उपयोग करके एक बेसिक सर्विस वर्कर है
// Workbox लाइब्रेरी का नया वर्शन इंपोर्ट करें (पिछले वाले से थोड़ा अपडेटेड)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

// Workbox के उपलब्ध होने की जाँच करें
if (!workbox) {
  console.error('Workbox did not load');
} else {
  console.log('Workbox loaded successfully');

  // Precaching: उन फ़ाइलों की सूची जिन्हें ऐप इंस्टॉल होने पर कैश करना है।
  // ये आपके ऐप के मुख्य एसेट हैं जो ऑफलाइन उपलब्ध होने चाहिए।
  // GitHub Pages सबडायरेक्टरी '/Pradeep-Samrat-Calculator/' को ध्यान में रखते हुए पाथ सेट करें।
  workbox.precaching.precacheAndRoute([
    { url: '/Pradeep-Samrat-Calculator/index.html', revision: '1' }, // मुख्य HTML फ़ाइल
    { url: '/Pradeep-Samrat-Calculator/styles.css', revision: '1' }, // CSS स्टाइल
    { url: '/Pradeep-Samrat-Calculator/script.js', revision: '1' }, // मुख्य JavaScript
    { url: '/Pradeep-Samrat-Calculator/manifest.json', revision: '1' }, // वेब ऐप मैनिफेस्ट
    { url: '/Pradeep-Samrat-Calculator/icons/manifest-icon-192.png', revision: '1' }, // आइकॉन
    { url: '/Pradeep-Samrat-Calculator/icons/manifest-icon-512.png', revision: '1' }, // आइकॉन
    // यदि आपके पास अन्य महत्वपूर्ण स्थिर फ़ाइलें हैं (जैसे कोई और JS, CSS, या इमेजेस) तो उन्हें यहां इसी फॉर्मेट में जोड़ें।
  ]);

  // Navigation requests (जब यूज़र किसी पेज पर जाता है) के लिए रणनीति:
  // पहले नेटवर्क पर जाने की कोशिश करें।
  // यदि नेटवर्क उपलब्ध नहीं है (ऑफ़लाइन होने पर), तो precache से index.html दिखाएं।
  workbox.routing.registerNavigationRoute(
    workbox.precaching.createHandlerBoundToCacheList(
        '/Pradeep-Samrat-Calculator/index.html' // ऑफ़लाइन होने पर दिखाने के लिए फ़ाइल
    )
    // { allowlist: [/./] } // यदि आप सभी नेविगेशन को हैंडल करना चाहते हैं
  );

  // अन्य सभी स्थिर संपत्तियों (जैसे images, fonts, audio, video) के लिए Cache First रणनीति:
  // पहले कैश में देखें। अगर कैश में है, तो कैश से दें।
  // अगर कैश में नहीं है, तो नेटवर्क से लाएं और कैश में सेव करें फिर नेटवर्क रिस्पॉन्स दें।
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' ||
                     request.destination === 'script' ||
                     request.destination === 'image' ||
                     request.destination === 'font' ||
                     request.destination === 'audio' ||
                     request.destination === 'video',
    new workbox.strategies.CacheFirst({
      cacheName: 'static-assets', // इस कैश का नाम
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60, // कैश में अधिकतम एंट्री की संख्या
          maxAgeSeconds: 30 * 24 * 60 * 60, // आइटम को 30 दिनों तक कैश में रखें
        }),
      ],
    })
  );

   // API कॉल्स या अन्य रिक्वेस्ट के लिए Network First रणनीति (वैकल्पिक):
   // पहले नेटवर्क से डेटा लाने की कोशिश करें। अगर नेटवर्क फेल होता है, तो कैश देखें।
   /*
   workbox.routing.registerRoute(
     ({ url }) => url.pathname.startsWith('/api/'), // अपनी API पाथ से बदलें
     new workbox.strategies.NetworkFirst({
       cacheName: 'api-cache',
       plugins: [
         new workbox.expiration.ExpirationPlugin({
           maxEntries: 20,
           maxAgeSeconds: 24 * 60 * 60, // 24 घंटे
         }),
       ],
     })
   );
   */

  // अगर कोई रिक्वेस्ट ऊपर की किसी भी रणनीति से मैच नहीं करती है, तो डिफ़ॉल्ट रूप से सिर्फ नेटवर्क पर जाएं।
  // अगर नेटवर्क फेल होता है, तो यह रिक्वेस्ट फेल हो जाएगी (जब तक कि navigationRoute इसे हैंडल न करे)।
  // workbox.routing.setDefaultHandler(new workbox.strategies.NetworkOnly());


  // यह सुनिश्चित करने के लिए कि नया सर्विस वर्कर ब्राउज़र टैब बंद होने पर तुरंत एक्टिवेट हो जाए
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

}
