window.OPH_CONFIG = {
  firebase: {
    enabled: true,

    apiKey: "AIzaSyB7CU8sGm4VMO63Rs8xSaGG4V-rJWxBmTg",

    authDomain: "caindo-em-uma-fria.firebaseapp.com",

    databaseURL: "https://caindo-em-uma-fria-default-rtdb.firebaseio.com",

    projectId: "caindo-em-uma-fria",

    appId: "1:933514598776:web:c1a68963c4544fbf64108d"
  },

  // Google Maps JavaScript API: configure a browser-restricted key from Google Cloud.
  // This is NOT the Firebase key. An empty value shows a tactical grid fallback.
  // Restrict the Maps key by HTTP referrers + API restrictions before deploying.
  map: {
    apiKey: "",
    mapId: "",
    center: { lat: -23.5505, lng: -46.6333 }
  },

  defaultRoom: "FRIA-01",

  localAdminPasswordHint:
    "A senha do painel local não é exibida no site."
};
