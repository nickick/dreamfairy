import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { EdgeFunctions } from '@/lib/edgeFunctions';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export function NetworkDiagnostics() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      // Test 1: Check environment variables
      addResult('=== Environment Check ===');
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      addResult(`Supabase URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
      addResult(`Supabase Key: ${supabaseKey ? 'Present' : 'Missing'}`);
      
      if (!supabaseUrl || !supabaseKey) {
        addResult('ERROR: Missing environment variables!');
        return;
      }

      // Test 2: Direct HTTPS fetch test
      addResult('\n=== Direct HTTPS Test ===');
      try {
        const httpsResponse = await fetch('https://httpbin.org/get');
        await httpsResponse.json();
        addResult(`HTTPS Test: Success (Status: ${httpsResponse.status})`);
      } catch (error) {
        addResult(`HTTPS Test Failed: ${error}`);
      }

      // Test 3: Test Supabase URL directly
      addResult('\n=== Supabase URL Test ===');
      try {
        const supabaseResponse = await fetch(supabaseUrl!);
        addResult(`Supabase URL reachable: ${supabaseResponse.status}`);
      } catch (error) {
        addResult(`Supabase URL unreachable: ${error}`);
      }

      // Test 4: Test Supabase auth endpoint
      addResult('\n=== Supabase Auth Test ===');
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          addResult(`Auth test error: ${error.message}`);
        } else {
          addResult(`Auth test success: ${data?.session ? 'Authenticated' : 'Not authenticated'}`);
        }
      } catch (error) {
        addResult(`Auth test exception: ${error}`);
      }

      // Test 5: Test edge function
      addResult('\n=== Edge Function Test ===');
      try {
        await EdgeFunctions.generateStory({
          seed: 'test',
          history: [],
          language: 'en'
        });
        addResult('Edge function test: Success');
      } catch (error) {
        addResult(`Edge function test failed: ${error}`);
        if (error instanceof Error) {
          addResult(`Error details: ${error.message}`);
        }
      }

      // Test 6: Network info
      addResult('\n=== Network Info ===');
      // @ts-ignore
      if (global.navigator && global.navigator.connection) {
        // @ts-ignore
        const connection = global.navigator.connection;
        addResult(`Connection type: ${connection.effectiveType || 'Unknown'}`);
      } else {
        addResult('Network info not available');
      }

    } catch (error) {
      addResult(`Unexpected error: ${error}`);
    } finally {
      setTesting(false);
      addResult('\n=== Diagnostics Complete ===');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Network Diagnostics</ThemedText>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={runDiagnostics}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Running Tests...' : 'Run Network Tests'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
});