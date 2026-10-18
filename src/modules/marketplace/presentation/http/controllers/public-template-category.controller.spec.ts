import { IS_PUBLIC_KEY } from 'src/common/decorator/public.decorator';
import { AdminTemplateCategoryController } from 'src/modules/admin/presentation/http/controllers/admin-template-category.controller';

import { PublicTemplateCategoryController } from './public-template-category.controller';

// Guests must read categories (public marketplace filter); category
// management stays admin-only.
describe('template category access', () => {
  const isPublic = (target: object) =>
    Reflect.getMetadata(IS_PUBLIC_KEY, target) === true;

  it('the public category list allows guests', () => {
    expect(isPublic(PublicTemplateCategoryController.prototype.list)).toBe(true);
  });

  it.each(['create', 'list', 'updateCategory', 'changeStatus'] as const)(
    'admin %s stays authenticated',
    (method) => {
      expect(isPublic(AdminTemplateCategoryController)).toBe(false);
      expect(isPublic(AdminTemplateCategoryController.prototype[method])).toBe(
        false,
      );
    },
  );
});
