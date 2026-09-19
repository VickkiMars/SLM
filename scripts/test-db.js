const historyService = require('../services/historyService');
const dbService = require('../services/dbService');
const assert = require('assert');

async function runTests() {
  console.log('--- STARTING SQLITE DB & RLS VERIFICATION TESTS ---');

  const userA = 'user_alice_123';
  const userB = 'user_bob_456';

  // 1. Create session for User A
  console.log('1. Testing saveSession for User A...');
  const sessionA = await historyService.saveSession({
    user_id: userA,
    title: 'Alice Japanese Session',
    source_text: 'こんにちは世界',
    original_language: 'Japanese',
    target_language: 'English',
    full_translation: 'Hello World',
    token_metadata: {
      words: [{ source_word: 'こんにちは', translated_word: 'Hello', pronunciation: 'konnichiwa' }]
    },
    tags: ['Japanese', 'Greeting'],
    is_bookmarked: true
  });

  assert(sessionA && sessionA.id, 'Session A should be created with an ID');
  assert.strictEqual(sessionA.user_id, userA, 'Session A user_id should match Alice');
  console.log('✓ Session A created successfully:', sessionA.id);

  // 2. Create session for User B
  console.log('2. Testing saveSession for User B...');
  const sessionB = await historyService.saveSession({
    user_id: userB,
    title: 'Bob Spanish Session',
    source_text: 'Hola mundo',
    original_language: 'Spanish',
    target_language: 'English',
    full_translation: 'Hello World',
    tags: ['Spanish'],
    is_bookmarked: false
  });

  assert(sessionB && sessionB.id, 'Session B should be created with an ID');
  assert.strictEqual(sessionB.user_id, userB, 'Session B user_id should match Bob');
  console.log('✓ Session B created successfully:', sessionB.id);

  // 3. Verify RLS Isolation on List History
  console.log('3. Testing RLS Isolation on history listing...');
  const historyA = await historyService.getUserHistory(userA);
  assert(historyA.sessions.every(s => s.user_id === userA), 'User A should ONLY see User A sessions');
  assert(historyA.sessions.some(s => s.id === sessionA.id), 'User A should see Session A');
  assert(!historyA.sessions.some(s => s.id === sessionB.id), 'User A should NOT see Session B');
  console.log(`✓ RLS listing isolation verified. User A returned ${historyA.total} session(s).`);

  // 4. Verify RLS Isolation on Direct ID Access
  console.log('4. Testing RLS Isolation on getSessionById...');
  const crossAccess = await historyService.getSessionById(userA, sessionB.id);
  assert.strictEqual(crossAccess, null, 'User A should receive null when attempting to access User B session');
  console.log('✓ Cross-tenant access blocked successfully (returned null).');

  // 5. Verify RLS Immutability Trigger
  console.log('5. Testing RLS Immutability Trigger...');
  try {
    const stmt = dbService.db.prepare('UPDATE reading_sessions SET user_id = ? WHERE id = ?');
    stmt.run(userB, sessionA.id);
    assert.fail('Should have thrown RLS trigger violation error');
  } catch (err) {
    assert(err.message.includes('RLS Violation'), `Error message should mention RLS Violation: ${err.message}`);
    console.log('✓ SQLite Trigger successfully blocked unauthorized user_id ownership change.');
  }

  // 6. Test session deletion
  console.log('6. Testing deleteSession...');
  const deleted = await historyService.deleteSession(userA, sessionA.id);
  assert.strictEqual(deleted, true, 'Session A should be deleted');
  const checkDeleted = await historyService.getSessionById(userA, sessionA.id);
  assert.strictEqual(checkDeleted, null, 'Session A should no longer exist');
  console.log('✓ Session deleted successfully.');

  console.log('\n✅ ALL SQLITE DB & RLS TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ DB TEST FAILED:', err);
  process.exit(1);
});
