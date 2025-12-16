// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { initializeApp } from 'firebase/app';

// Initialize Firebase for testing with a mock config
// This prevents "No Firebase App '[DEFAULT]' has been created" errors
const testFirebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
};

try {
  initializeApp(testFirebaseConfig);
} catch (error: unknown) {
  // Ignore if already initialized
  if (error instanceof Error && !error.message?.includes('duplicate-app')) {
    console.error('Firebase initialization error:', error);
  }
}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
});
