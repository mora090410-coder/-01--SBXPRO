
const API_BASE = 'http://127.0.0.1:8788/api/pools';

async function testBackend() {
    console.log('🚀 Starting Backend Verification Stress Test (5 Leagues)...');

    const leagues = [];
    const errors = [];

    // 1. Create 5 Leagues
    console.log('\n[Phase 1] Creating 5 Unique Leagues...');
    for (let i = 1; i <= 5; i++) {
        try {
            const payload = {
                game: {
                    title: `Test League ${i}`,
                    leftAbbr: 'KC',
                    topAbbr: 'PHI',
                    dates: '2024-02-11',
                    isTest: true
                },
                board: {
                    bearsAxis: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    oppAxis: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    squares: Array(100).fill([])
                }
            };

            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (!data.poolId || !data.success) throw new Error('Invalid response format');

            console.log(`✅ Created League #${i}: ${data.poolId}`);
            leagues.push({ id: data.poolId, num: i });

        } catch (err) {
            console.error(`❌ Failed to create League #${i}:`, err.message);
            errors.push(`Create #${i}: ${err.message}`);
        }
    }

    // 2. Verify Uniqueness
    const uniqueIds = new Set(leagues.map(l => l.id));
    if (uniqueIds.size !== leagues.length) {
        errors.push(`Duplicate IDs detected! Created ${leagues.length} but only ${uniqueIds.size} unique.`);
    } else {
        console.log(`\n[Phase 2] Uniqueness Check: PASS (${uniqueIds.size} unique IDs)`);
    }

    // 3. Retrieve All 5 Leagues
    console.log('\n[Phase 3] Verifying Data Retrieval...');
    for (const league of leagues) {
        try {
            const res = await fetch(`${API_BASE}/${league.id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data.data.game.title !== `Test League ${league.num}`) {
                throw new Error(`Data mismatch. Expected "Test League ${league.num}", got "${data.data.game.title}"`);
            }

            // Verify Admin Token is NOT exposed in public GET
            if (data.adminToken) {
                throw new Error('SECURITY FAIL: Admin Token exposed in public API!');
            }

            console.log(`✅ Retrieved ${league.id}: "${data.data.title}"`);

        } catch (err) {
            console.error(`❌ Failed to retrieve ${league.id}:`, err.message);
            errors.push(`Get ${league.id}: ${err.message}`);
        }
    }

    console.log('\n----------------------------------------');
    if (errors.length === 0) {
        console.log('🎉 SUCCESS: Backend is 100% Ready for Multi-League Support.');
        console.log('All 5 leagues persisted and retrieved correctly.');
    } else {
        console.error('⚠️ FAIL: Issues detected during verification.');
        errors.forEach(e => console.error(`- ${e}`));
        process.exit(1);
    }
}

testBackend();
