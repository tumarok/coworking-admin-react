import { Chip } from 'primereact/chip';

import type { Amenity } from '@/shared/api';
import { humanize } from '@/shared/lib';

const ICONS: Record<Amenity, string> = {
  projector: 'pi pi-video',
  whiteboard: 'pi pi-pencil',
  video_conferencing: 'pi pi-desktop',
  phone: 'pi pi-phone',
  standing_desks: 'pi pi-arrows-v',
  natural_light: 'pi pi-sun',
};

export const AmenityList = ({ amenities }: { amenities: Amenity[] }) =>
  amenities.length === 0 ? (
    <span>—</span>
  ) : (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.375rem' }}>
      {amenities.map((a) => (
        <Chip key={a} label={humanize(a)} icon={ICONS[a]} />
      ))}
    </span>
  );
