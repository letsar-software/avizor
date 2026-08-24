import CategoryDetailV2 from "@/components/results/CategoryDetailV2";
export default async function CategoryDetail({params}:{params:Promise<{categoria:string}>}){return <CategoryDetailV2 slug={(await params).categoria}/>;}
