import CategoryDetailV2 from "@/components/results/CategoryDetailV2";
export default function CategoryDetail({params}:{params:{categoria:string}}){return <CategoryDetailV2 slug={params.categoria}/>;}