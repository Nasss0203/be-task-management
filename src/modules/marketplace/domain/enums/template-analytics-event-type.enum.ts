/** Events that existing transactional tables cannot reconstruct. Purchases and revenue stay in template_purchases. */
export enum TemplateAnalyticsEventType {
  VIEW = 'VIEW',
  USE = 'USE',
}
