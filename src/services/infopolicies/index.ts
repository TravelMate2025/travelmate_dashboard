import instance from "@/hooks/initializers/useAxiosDefaults";
import env from "@/config/env";

// Fetch all contents
export const fetchAllContents = async () => {
    const [aboutRes, privacyRes, termsRes, partnerRes, partnerCategoryRes] =
        await Promise.all([
            instance.get(env.api.aboutus),
            instance.get(env.api.privacypolicy),
            instance.get(env.api.termsofuse),
            instance.get(env.api.partners),
            instance.get(env.api.partnercategories),
        ]);

    return {
        about: aboutRes.data,
        privacy: privacyRes.data,
        terms: termsRes.data,
        partners: partnerRes.data,
        partnerCategories: partnerCategoryRes.data,
    };
};

// About APIs
export const addAbout = (content: string) =>
    instance.post(env.api.aboutus, { content });

export const updateAbout = (id: number, content: string, lastUpdated: string) =>
    instance.patch(`${env.api.aboutus}${id}/`, {
        content,
        last_updated: lastUpdated,
    });

// Privacy APIs
export const addPrivacy = (content: string) =>
    instance.post(env.api.privacypolicy, { content });

export const updatePrivacy = (
    id: number,
    content: string,
    lastUpdated: string
) =>
    instance.patch(`${env.api.privacypolicy}${id}/`, {
        content,
        last_updated: lastUpdated,
    });

// Terms APIs
export const addTerms = (content: string) =>
    instance.post(env.api.termsofuse, { content });

export const updateTerms = (id: number, content: string, lastUpdated: string) =>
    instance.patch(`${env.api.termsofuse}${id}/`, {
        content,
        last_updated: lastUpdated,
    });

// Partner APIs
export const fetchPartnersCategories = () =>
    instance.get(`${env.api.admin}/partner-categories/`);


export const deletePartner = (id: number) =>
    instance.delete(`${env.api.partners}${id}/`);

// History API
export const fetchHistory = () =>
    instance.get(`${env.api.admin}/policy-update-history/`);
