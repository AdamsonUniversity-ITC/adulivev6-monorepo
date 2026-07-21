import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { hrmdoSvc } from "@repo/axios-config/hrmdo-service";
import { authSvc } from "@repo/axios-config/auth-service";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
    // const { data, isLoading, error } = useQuery({
    //   queryKey: ["test"],
    //   queryFn: async () => {
    //     const res = await hrmdoSvc.get("/v1/students?school_year=2025-2026&term=1&keyword=202210345&with=subjects");
    //     return res.data;
    //   },
    // });

    const { data, isLoading, error } = useQuery({
      queryKey: ["test"],
      queryFn: async () => {
        const res = await hrmdoSvc.get(
          "/v1/teachers?school_year=2025-2026&term=1&keyword=2009070139&with=sections"
        );
        return res.data;
      },
    });

    // const { data, isLoading, error } = useQuery({
    //   queryKey: ["test"],
    //   queryFn: async () => {
    //     const res = await authSvc.get("user");
    //     return res.data;
    //   },
    // });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
