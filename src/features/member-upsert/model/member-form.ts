import { z } from 'zod';

import { type Member, type MemberInput, memberInputSchema } from '@/shared/api';

/** An empty company field means "no company". */
export const memberFormSchema = memberInputSchema.extend({
  company: z.string().trim().max(80),
});

export type MemberFormValues = z.infer<typeof memberFormSchema>;

export const toMemberFormValues = (member?: Member | null): MemberFormValues =>
  member
    ? {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        company: member.company ?? '',
        plan: member.plan,
        status: member.status,
      }
    : {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        plan: 'flex',
        status: 'active',
      };

export const toMemberInput = (values: MemberFormValues): MemberInput => ({
  ...values,
  company: values.company || null,
});
