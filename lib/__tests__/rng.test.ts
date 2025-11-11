import { SecureRNG, RNGManager, createGameRNG } from '../rng'

// Note: This would typically use a testing framework like Jest
// For now, it's a simple test function to validate functionality

export function testSecureRNG() {
  console.log('Testing SecureRNG...')

  // Test basic functionality
  const rng = new SecureRNG('test-game')
  
  // Test initial state
  console.assert(rng.getCallCount() === 0, 'Initial call count should be 0')
  console.assert(rng.getRemainingCount() === 75, 'Should have 75 numbers initially')
  console.assert(rng.validateIntegrity(), 'Initial integrity should be valid')

  // Test number drawing
  const firstNumber = rng.drawNumber()
  console.assert(firstNumber !== null, 'Should draw a valid number')
  console.assert(firstNumber >= 1 && firstNumber <= 75, 'Number should be in valid range')
  console.assert(rng.getCallCount() === 1, 'Call count should increment')
  console.assert(rng.getRemainingCount() === 74, 'Remaining count should decrement')

  // Test called numbers tracking
  const calledNumbers = rng.getCalledNumbers()
  console.assert(calledNumbers.length === 1, 'Should track one called number')
  console.assert(calledNumbers[0] === firstNumber, 'Should track the correct number')

  // Test BINGO letter functionality
  const letter = SecureRNG.getBingoLetter(firstNumber!)
  const expectedLetters = ['B', 'I', 'N', 'G', 'O']
  console.assert(expectedLetters.includes(letter), 'Should return valid BINGO letter')

  const displayString = SecureRNG.getDisplayString(firstNumber!)
  console.assert(displayString.includes(letter), 'Display string should include letter')
  console.assert(displayString.includes(firstNumber!.toString()), 'Display string should include number')

  // Test drawing all numbers
  const allDrawnNumbers = new Set([firstNumber])
  while (rng.getRemainingCount() > 0) {
    const num = rng.drawNumber()
    if (num !== null) {
      console.assert(!allDrawnNumbers.has(num), 'Should not draw duplicate numbers')
      allDrawnNumbers.add(num)
    }
  }

  console.assert(allDrawnNumbers.size === 75, 'Should draw all 75 numbers')
  console.assert(rng.drawNumber() === null, 'Should return null when pool is empty')

  // Test serialization
  const rng2 = new SecureRNG('test-game-2')
  rng2.drawNumber()
  rng2.drawNumber()
  
  const serialized = rng2.serialize()
  const deserialized = SecureRNG.deserialize(serialized)
  
  console.assert(
    deserialized.getCallCount() === rng2.getCallCount(),
    'Deserialized RNG should have same call count'
  )
  console.assert(
    JSON.stringify(deserialized.getCalledNumbers()) === JSON.stringify(rng2.getCalledNumbers()),
    'Deserialized RNG should have same called numbers'
  )

  // Test RNG Manager
  const gameId = 'manager-test'
  const managedRNG = RNGManager.getInstance(gameId)
  const sameRNG = RNGManager.getInstance(gameId)
  
  console.assert(managedRNG === sameRNG, 'Manager should return same instance for same game ID')
  
  managedRNG.drawNumber()
  console.assert(sameRNG.getCallCount() === 1, 'Shared instance should reflect changes')
  
  console.assert(RNGManager.getActiveGames().includes(gameId), 'Should track active games')
  console.assert(RNGManager.removeInstance(gameId), 'Should remove instance')
  console.assert(!RNGManager.getActiveGames().includes(gameId), 'Should not track removed games')

  console.log('All SecureRNG tests passed! ✅')
}

// Statistical test to verify randomness (basic check)
export function testRandomnessDistribution() {
  console.log('Testing randomness distribution...')
  
  const trials = 100
  const distributions = {
    B: 0, I: 0, N: 0, G: 0, O: 0
  }
  
  for (let i = 0; i < trials; i++) {
    const rng = new SecureRNG()
    const firstNumber = rng.drawNumber()!
    const letter = SecureRNG.getBingoLetter(firstNumber)
    distributions[letter as keyof typeof distributions]++
  }
  
  // Each letter should appear roughly 20% of the time (15/75 numbers per letter)
  // Allow some variance but check for obvious bias
  Object.values(distributions).forEach(count => {
    const percentage = (count / trials) * 100
    console.assert(
      percentage > 5 && percentage < 35,
      `Distribution seems biased: ${percentage}% (expected ~20%)`
    )
  })
  
  console.log('Distribution test passed! ✅', distributions)
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSecureRNG()
  testRandomnessDistribution()
}