package com.school.service.impl;

import com.school.document.SchoolClass;
import com.school.document.Subject;
import com.school.document.Teacher;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class TimetableGeneratorGA {

    private final int populationSize = 100;
    private final int generations = 300;
    private final double mutationRate = 0.08;

    private final List<String> subjectIds;
    private final Map<String, Integer> requiredCount; // subjectId -> slots required
    private final Map<String, List<String>> subjectTeachers; // subjectId -> teacherIds
    private final Map<String, Integer> teacherMaxHours; // teacherId -> max hours (nullable)
    private final int days;
    private final int periods;

    public static class Result {
        public final String[] assignment; // length = days*periods, each entry subjectId or null
        public Result(String[] assignment) { this.assignment = assignment; }
    }

    public TimetableGeneratorGA(SchoolClass schoolClass,
                                Map<String,Integer> requiredCount,
                                Map<String, List<String>> subjectTeachers,
                                Map<String,Integer> teacherMaxHours,
                                int days, int periods) {
        this.subjectIds = schoolClass.getSubjectIds() == null ? List.of() : new ArrayList<>(schoolClass.getSubjectIds());
        this.requiredCount = requiredCount;
        this.subjectTeachers = subjectTeachers;
        this.teacherMaxHours = teacherMaxHours;
        this.days = days; this.periods = periods;
    }

    public Result run() {
        int slots = days * periods;

        // prepare base gene list that respects required counts as much as possible
        List<String> base = new ArrayList<>();
        requiredCount.forEach((s,c) -> {
            for (int i=0;i<Math.max(0, Math.min(c, slots)); i++) base.add(s);
        });
        while (base.size() < slots) base.add(null);

        List<String[]> pop = new ArrayList<>();
        Random rnd = new Random(123);
        for (int i=0;i<populationSize;i++) {
            List<String> copy = new ArrayList<>(base);
            Collections.shuffle(copy, rnd);
            pop.add(copy.toArray(new String[0]));
        }

        String[] best = pop.get(0);
        double bestScore = Double.NEGATIVE_INFINITY;

        for (int gen=0; gen<generations; gen++) {
            // evaluate
            List<Double> scores = new ArrayList<>();
            for (String[] chrom : pop) scores.add(-fitness(chrom)); // lower penalty better

            // find best
            for (int i=0;i<pop.size();i++) {
                double s = scores.get(i);
                if (s > bestScore) { bestScore = s; best = pop.get(i); }
            }

            // selection: tournament
            List<String[]> next = new ArrayList<>();
            while (next.size() < populationSize) {
                String[] a = tournament(pop, scores, rnd);
                String[] b = tournament(pop, scores, rnd);
                String[] child = crossover(a,b, rnd);
                if (rnd.nextDouble() < mutationRate) mutate(child, rnd);
                next.add(child);
            }
            pop = next;
        }

        return new Result(best);
    }

    private String[] tournament(List<String[]> pop, List<Double> scores, Random rnd) {
        int k = 3;
        String[] best = null; double bestScore = Double.NEGATIVE_INFINITY;
        for (int i=0;i<k;i++) {
            int idx = rnd.nextInt(pop.size());
            double s = scores.get(idx);
            if (s > bestScore) { bestScore = s; best = pop.get(idx); }
        }
        return Arrays.copyOf(best, best.length);
    }

    private String[] crossover(String[] a, String[] b, Random rnd) {
        int n = a.length; int pt = rnd.nextInt(n);
        String[] child = new String[n];
        for (int i=0;i<n;i++) child[i] = i<pt ? a[i] : b[i];
        return child;
    }

    private void mutate(String[] c, Random rnd) {
        int n = c.length;
        int i = rnd.nextInt(n); int j = rnd.nextInt(n);
        String tmp = c[i]; c[i] = c[j]; c[j] = tmp;
    }

    // Penalty-based fitness (lower penalty => higher fitness)
    private double fitness(String[] chrom) {
        int slots = days * periods;
        // Count assigned per subject
        Map<String,Integer> count = new HashMap<>();
        for (String s: chrom) if (s!=null) count.put(s, count.getOrDefault(s,0)+1);

        double penalty = 0.0;
        // subject required difference
        for (var e : requiredCount.entrySet()) {
            int got = count.getOrDefault(e.getKey(), 0);
            penalty += Math.abs(got - e.getValue()) * 50.0; // heavy
        }

        // penalty for null slots
        for (String s: chrom) if (s==null) penalty += 2.0;

        // penalty for consecutive same-subject in a day
        for (int d=0; d<days; d++) {
            for (int p=0; p<periods-1; p++) {
                String a = chrom[d*periods + p];
                String b = chrom[d*periods + p+1];
                if (a!=null && a.equals(b)) penalty += 1.0;
            }
        }

        // assign teachers greedily to compute load penalties
        Map<String,Integer> teacherLoad = new HashMap<>();
        for (String subjId : chrom) {
            if (subjId == null) continue;
            List<String> tlist = subjectTeachers.getOrDefault(subjId, List.of());
            if (tlist.isEmpty()) { penalty += 20.0; continue; }
            // pick teacher with minimal current load
            String pick = tlist.get(0);
            int min = teacherLoad.getOrDefault(pick, 0);
            for (String t : tlist) {
                int l = teacherLoad.getOrDefault(t, 0);
                if (l < min) { min = l; pick = t; }
            }
            teacherLoad.put(pick, teacherLoad.getOrDefault(pick,0)+1);
        }

        // penalty if teacher exceeds max hours
        for (var e : teacherLoad.entrySet()) {
            Integer max = teacherMaxHours.get(e.getKey());
            if (max != null && e.getValue() > max) penalty += (e.getValue()-max) * 30.0;
        }

        return -penalty; // higher is better
    }
}
