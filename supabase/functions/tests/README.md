# Edge Functions Tests

This directory contains automated tests for all Supabase Edge Functions.

## Running Tests

```bash
# Run all tests
npm run test:functions

# Or directly with deno
deno test supabase/functions/tests/ --allow-all --no-check

# Run a specific test file
deno test supabase/functions/tests/auth.test.ts --allow-all --no-check
```

## Test Coverage

### Currently Implemented Tests

✅ **Authentication Module** (`auth.test.ts`)
- Validates auth header requirements
- Checks token validation
- Returns proper 401 responses

✅ **Generate Story Function** (`generate-story.test.ts`)
- Validates request method requirements
- Validates required seed parameter
- Validates response structure (story and choices)
- Handles optional history parameter

✅ **Generate Image Function** (`generate-image.test.ts`)
- Validates request method requirements
- Validates required prompt parameter
- Validates optional width/height parameters
- Validates response structure (imageUrl)

✅ **Speech to Text Function** (`speech-to-text.test.ts`)
- Validates request method requirements
- Validates required audioData parameter
- Validates optional storyContext parameter
- Validates response structure (transcript)
- Validates base64 audio format

✅ **Text to Speech Function** (`text-to-speech.test.ts`)
- Validates request method requirements
- Validates required text parameter
- Validates voice type options
- Validates optional voiceType parameter
- Validates response structure (audioData, audioUrl)
- Validates voice ID mapping

### Test Structure

- `test-utils.ts` - Shared testing utilities and mocks
- `auth.test.ts` - Tests for authentication module
- `generate-story.test.ts` - Validation tests for story generation
- `generate-image.test.ts` - Validation tests for image generation
- `speech-to-text.test.ts` - Validation tests for audio transcription
- `text-to-speech.test.ts` - Validation tests for speech synthesis
- `deno.test.config.ts` - Test configuration

### Planned Test Coverage

Each edge function should have comprehensive tests covering:

#### Authentication Tests
- ✅ Rejects requests without Authorization header
- ✅ Rejects requests with invalid tokens
- ✅ Validates user authentication before processing

#### Input Validation Tests  
- Validates required parameters
- Handles missing or invalid input
- Uses appropriate defaults when applicable

#### Success Path Tests
- Processes valid requests correctly
- Returns expected response format
- Handles different input variations

#### Error Handling Tests
- Handles external API failures gracefully
- Returns appropriate error messages
- Maintains security in error responses

## Integration Testing

For full integration testing of the edge functions:

1. Start Supabase locally: `npm run supabase:start`
2. Run the functions: `npm run supabase:functions`
3. Use the test client or curl to verify functionality

### Example Test Requests

```bash
# Test unauthorized request
curl -X POST http://localhost:54321/functions/v1/generate-story \
  -H "Content-Type: application/json" \
  -d '{"seed": "test"}'
# Expected: 401 Unauthorized

# Test with auth token (replace with actual token)
curl -X POST http://localhost:54321/functions/v1/generate-story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"seed": "A magical garden"}'
# Expected: 200 OK with story response

# Test generate-image function
curl -X POST http://localhost:54321/functions/v1/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt": "A fairy in a magical garden"}'

# Test speech-to-text function
curl -X POST http://localhost:54321/functions/v1/speech-to-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"audioData": "BASE64_ENCODED_AUDIO"}'

# Test text-to-speech function
curl -X POST http://localhost:54321/functions/v1/text-to-speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text": "Once upon a time", "voiceType": "narrator"}'
```

## Writing New Tests

When adding new edge functions, create a corresponding test file following the auth.test.ts pattern:

1. Import test utilities from Deno standard library
2. Test authentication requirements
3. Test input validation
4. Test successful execution (with mocked dependencies where possible)
5. Test error scenarios
6. Test edge cases specific to the function

## Notes

- The tests use Deno's built-in test runner with `--no-check` flag to bypass TypeScript checking issues
- Full mocking of edge function handlers is limited due to Deno's global restrictions
- For comprehensive testing, consider using integration tests with a real Supabase instance
- The auth module tests demonstrate the pattern for unit testing shared modules