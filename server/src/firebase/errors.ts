/* Error for particular transaction problem:
 *
 * Possible race condition: some other driver also tried to view 
 * at the sametime and won the transaction. Now the ride we 
 * thought existed is not available.
 */
export class RideTakenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RideTakenError";
  }
}